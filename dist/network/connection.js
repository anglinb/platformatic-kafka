import fastq from 'fastq';
import EventEmitter from 'node:events';
import { createConnection } from 'node:net';
import { connect as createTLSConnection } from 'node:tls';
import { createPromisifiedCallback, kCallbackPromise } from "../apis/callbacks.js";
import { SASLMechanisms } from "../apis/enumerations.js";
import { saslAuthenticateV2, saslHandshakeV1 } from "../apis/index.js";
import { connectionsApiChannel, connectionsConnectsChannel, createDiagnosticContext, notifyCreation } from "../diagnostic.js";
import { AuthenticationError, NetworkError, TimeoutError, UnexpectedCorrelationIdError, UserError } from "../errors.js";
import { protocolAPIsById } from "../protocol/apis.js";
import { EMPTY_OR_SINGLE_COMPACT_LENGTH_SIZE, INT32_SIZE } from "../protocol/definitions.js";
import { DynamicBuffer } from "../protocol/dynamic-buffer.js";
import { saslPlain, saslScramSha } from "../protocol/index.js";
import { Reader } from "../protocol/reader.js";
import { defaultCrypto } from "../protocol/sasl/scram-sha.js";
import { Writer } from "../protocol/writer.js";
import { loggers } from "../utils.js";
export const ConnectionStatuses = {
    NONE: 'none',
    CONNECTING: 'connecting',
    AUTHENTICATING: 'authenticating',
    CONNECTED: 'connected',
    CLOSED: 'closed',
    CLOSING: 'closing',
    ERROR: 'error'
};
export const defaultOptions = {
    connectTimeout: 5000,
    maxInflights: 5
};
let currentInstance = 0;
export class Connection extends EventEmitter {
    #host;
    #port;
    #options;
    #status;
    #instanceId;
    #clientId;
    // @ts-ignore This is used just for debugging
    #ownerId;
    #correlationId;
    #nextMessage;
    #afterDrainRequests;
    #requestsQueue;
    #inflightRequests;
    #responseBuffer;
    #responseReader;
    #socket;
    #socketMustBeDrained;
    constructor(clientId, options = {}) {
        super();
        this.setMaxListeners(0);
        this.#instanceId = currentInstance++;
        this.#options = Object.assign({}, defaultOptions, options);
        this.#status = ConnectionStatuses.NONE;
        this.#clientId = clientId;
        this.#ownerId = options.ownerId;
        this.#correlationId = 0;
        this.#nextMessage = 0;
        this.#afterDrainRequests = [];
        this.#requestsQueue = fastq((op, cb) => op(cb), this.#options.maxInflights);
        this.#inflightRequests = new Map();
        this.#responseBuffer = new DynamicBuffer();
        this.#responseReader = new Reader(this.#responseBuffer);
        this.#socketMustBeDrained = false;
        notifyCreation('connection', this);
    }
    get host() {
        return this.#status === ConnectionStatuses.CONNECTED ? this.#host : undefined;
    }
    get port() {
        return this.#status === ConnectionStatuses.CONNECTED ? this.#port : undefined;
    }
    get instanceId() {
        return this.#instanceId;
    }
    get status() {
        return this.#status;
    }
    get socket() {
        return this.#socket;
    }
    connect(host, port, callback) {
        if (!callback) {
            callback = createPromisifiedCallback();
        }
        const diagnosticContext = createDiagnosticContext({ connection: this, operation: 'connect', host, port });
        connectionsConnectsChannel.start.publish(diagnosticContext);
        try {
            if (this.#status === ConnectionStatuses.CONNECTED) {
                callback(null);
                return callback[kCallbackPromise];
            }
            this.ready(callback);
            if (this.#status === ConnectionStatuses.CONNECTING) {
                return callback[kCallbackPromise];
            }
            this.#status = ConnectionStatuses.CONNECTING;
            const connectionOptions = {
                timeout: this.#options.connectTimeout
            };
            if (this.#options.tlsServerName) {
                connectionOptions.servername =
                    typeof this.#options.tlsServerName === 'string' ? this.#options.tlsServerName : host;
            }
            const connectionTimeoutHandler = () => {
                const error = new TimeoutError(`Connection to ${host}:${port} timed out.`);
                diagnosticContext.error = error;
                this.#socket.destroy();
                this.#status = ConnectionStatuses.ERROR;
                connectionsConnectsChannel.error.publish(diagnosticContext);
                connectionsConnectsChannel.asyncStart.publish(diagnosticContext);
                this.emit('timeout', error);
                this.emit('error', error);
                connectionsConnectsChannel.asyncEnd.publish(diagnosticContext);
            };
            const connectionErrorHandler = (error) => {
                this.#onConnectionError(host, port, diagnosticContext, error);
            };
            this.emit('connecting');
            this.#host = host;
            this.#port = port;
            /* c8 ignore next 3 - TLS connection is not tested but we rely on Node.js tests */
            this.#socket = this.#options.tls
                ? createTLSConnection(port, host, { ...this.#options.tls, ...connectionOptions })
                : createConnection({ ...connectionOptions, port, host });
            this.#socket.setNoDelay(true);
            this.#socket.once(this.#options.tls ? 'secureConnect' : 'connect', () => {
                this.#socket.removeListener('timeout', connectionTimeoutHandler);
                this.#socket.removeListener('error', connectionErrorHandler);
                this.#socket.on('error', this.#onError.bind(this));
                this.#socket.on('data', this.#onData.bind(this));
                this.#socket.on('drain', this.#onDrain.bind(this));
                this.#socket.on('close', this.#onClose.bind(this));
                this.#socket.setTimeout(0);
                if (this.#options.sasl) {
                    this.#authenticate(host, port, diagnosticContext);
                }
                else {
                    this.#onConnectionSucceed(diagnosticContext);
                }
            });
            this.#socket.once('timeout', connectionTimeoutHandler);
            this.#socket.once('error', connectionErrorHandler);
        }
        catch (error) {
            this.#status = ConnectionStatuses.ERROR;
            diagnosticContext.error = error;
            connectionsConnectsChannel.error.publish(diagnosticContext);
            throw error;
        }
        finally {
            connectionsConnectsChannel.end.publish(diagnosticContext);
        }
        return callback[kCallbackPromise];
    }
    ready(callback) {
        if (!callback) {
            callback = createPromisifiedCallback();
        }
        const onConnect = () => {
            this.removeListener('error', onError);
            callback(null);
        };
        const onError = (error) => {
            this.removeListener('connect', onConnect);
            callback(error);
        };
        this.once('connect', onConnect);
        this.once('error', onError);
        this.emit('ready');
        return callback[kCallbackPromise];
    }
    close(callback) {
        if (!callback) {
            callback = createPromisifiedCallback();
        }
        if (this.#status === ConnectionStatuses.CLOSED ||
            this.#status === ConnectionStatuses.ERROR ||
            this.#status === ConnectionStatuses.NONE) {
            callback(null);
            return callback[kCallbackPromise];
        }
        else if (this.#status === ConnectionStatuses.CLOSING) {
            this.once('close', () => {
                callback(null);
            });
            return callback[kCallbackPromise];
        }
        // Ignore all disconnection errors
        this.#socket.removeAllListeners('error');
        this.#socket.once('error', () => { });
        this.#socket.once('close', () => {
            this.#status = ConnectionStatuses.CLOSED;
            this.emit('close');
            callback(null);
        });
        this.#status = ConnectionStatuses.CLOSING;
        this.emit('closing');
        this.#socket.end();
        return callback[kCallbackPromise];
    }
    send(apiKey, apiVersion, payload, responseParser, hasRequestHeaderTaggedFields, hasResponseHeaderTaggedFields, callback) {
        this.#requestsQueue.push(fastQueueCallback => {
            const correlationId = ++this.#correlationId;
            const request = {
                correlationId,
                apiKey,
                apiVersion,
                hasRequestHeaderTaggedFields,
                hasResponseHeaderTaggedFields,
                parser: responseParser,
                payload,
                callback: fastQueueCallback,
                diagnostic: createDiagnosticContext({
                    connection: this,
                    operation: 'send',
                    apiKey,
                    apiVersion,
                    correlationId
                })
            };
            if (this.#socketMustBeDrained) {
                this.#afterDrainRequests.push(request);
                return false;
            }
            return this.#sendRequest(request);
        }, callback);
    }
    #authenticate(host, port, diagnosticContext) {
        this.#status = ConnectionStatuses.AUTHENTICATING;
        const { mechanism, username, password } = this.#options.sasl;
        if (!SASLMechanisms.includes(mechanism)) {
            this.#onConnectionError(host, port, diagnosticContext, new UserError(`SASL mechanism ${mechanism} not supported.`));
            return;
        }
        saslHandshakeV1.api(this, mechanism, (error, response) => {
            if (error) {
                this.#onConnectionError(host, port, diagnosticContext, new AuthenticationError('Cannot find a suitable SASL mechanism.', { cause: error }));
                return;
            }
            this.emit('sasl:handshake', response.mechanisms);
            if (mechanism === 'PLAIN') {
                saslPlain.authenticate(saslAuthenticateV2.api, this, username, password, this.#onSaslAuthenticate.bind(this, host, port, diagnosticContext));
            }
            else {
                saslScramSha.authenticate(saslAuthenticateV2.api, this, mechanism.substring(6), username, password, defaultCrypto, this.#onSaslAuthenticate.bind(this, host, port, diagnosticContext));
            }
        });
    }
    /*
      Request => Size [Request Header v2] [payload]
      Request Header v2 => request_api_key request_api_version correlation_id client_id TAG_BUFFER
        request_api_key => INT16
        request_api_version => INT16
        correlation_id => INT32
        client_id => NULLABLE_STRING
    */
    #sendRequest(request) {
        connectionsApiChannel.start.publish(request.diagnostic);
        try {
            if (this.#status !== ConnectionStatuses.CONNECTED && this.#status !== ConnectionStatuses.AUTHENTICATING) {
                request.callback(new NetworkError('Connection closed'), undefined);
                return false;
            }
            let canWrite = true;
            const { correlationId, apiKey, apiVersion, payload: payloadFn, hasRequestHeaderTaggedFields } = request;
            const writer = Writer.create()
                .appendInt16(apiKey)
                .appendInt16(apiVersion)
                .appendInt32(correlationId)
                .appendString(this.#clientId, false);
            if (hasRequestHeaderTaggedFields) {
                writer.appendTaggedFields();
            }
            const payload = payloadFn();
            writer.appendFrom(payload);
            writer.prependLength();
            // Write the header
            this.#socket.cork();
            if (!payload.context.noResponse) {
                this.#inflightRequests.set(correlationId, request);
            }
            loggers.protocol('Sending request.', { apiKey: protocolAPIsById[apiKey], correlationId, request });
            for (const buf of writer.buffers) {
                if (!this.#socket.write(buf)) {
                    canWrite = false;
                }
            }
            if (!canWrite) {
                this.#socketMustBeDrained = true;
            }
            this.#socket.uncork();
            if (payload.context.noResponse) {
                request.callback(null, canWrite);
            }
            // debugDump(Date.now() % 100000, 'send', { owner: this.#ownerId, apiKey: protocolAPIsById[apiKey], correlationId })
            return canWrite;
        }
        catch (error) {
            request.diagnostic.error = error;
            connectionsApiChannel.error.publish(request.diagnostic);
            connectionsApiChannel.end.publish(request.diagnostic);
            throw error;
            /* c8 ignore next 3 - C8 does not detect these as covered */
        }
        finally {
            connectionsApiChannel.end.publish(request.diagnostic);
        }
    }
    #onConnectionSucceed(diagnosticContext) {
        this.#status = ConnectionStatuses.CONNECTED;
        connectionsConnectsChannel.asyncStart.publish(diagnosticContext);
        this.emit('connect');
        connectionsConnectsChannel.asyncEnd.publish(diagnosticContext);
    }
    #onConnectionError(host, port, diagnosticContext, cause) {
        const error = new NetworkError(`Connection to ${host}:${port} failed.`, { cause });
        this.#status = ConnectionStatuses.ERROR;
        diagnosticContext.error = error;
        connectionsConnectsChannel.error.publish(diagnosticContext);
        connectionsConnectsChannel.asyncStart.publish(diagnosticContext);
        this.emit('error', error);
        connectionsConnectsChannel.asyncEnd.publish(diagnosticContext);
        this.#socket.end();
    }
    #onSaslAuthenticate(host, port, diagnosticContext, error, response) {
        if (error) {
            const protocolError = error.errors[0];
            if (protocolError.apiId === 'SASL_AUTHENTICATION_FAILED') {
                error = new AuthenticationError('SASL authentication failed.', { cause: error });
            }
            this.#onConnectionError(host, port, diagnosticContext, error);
            return;
        }
        this.emit('sasl:authentication', response.authBytes);
        this.#onConnectionSucceed(diagnosticContext);
    }
    /*
      Response Header v1 => correlation_id TAG_BUFFER
        correlation_id => INT32
    */
    #onData(chunk) {
        this.#responseBuffer.append(chunk);
        // There is at least one message size to add
        // Note that here the initial position is always 0
        while (this.#responseBuffer.length > INT32_SIZE) {
            if (this.#nextMessage < 1) {
                this.#nextMessage = this.#responseReader.readInt32();
            }
            // Less data than the message size, wait for more data
            if (this.#nextMessage > this.#responseBuffer.length - INT32_SIZE) {
                break;
            }
            // Read the correlationId and get the handler
            const correlationId = this.#responseReader.readInt32();
            const request = this.#inflightRequests.get(correlationId);
            if (!request) {
                this.emit('error', new UnexpectedCorrelationIdError(`Received unexpected response with correlation_id=${correlationId}`, {
                    raw: this.#responseReader.buffer.slice(0, this.#nextMessage + INT32_SIZE)
                }));
                return;
            }
            this.#inflightRequests.delete(correlationId);
            const { apiKey, apiVersion, hasResponseHeaderTaggedFields, parser, callback } = request;
            let deserialized;
            let responseError = null;
            try {
                // Due to inconsistency in the wire protocol, the tag buffer in the header might have to be handled by the APIs
                // For example: https://github.com/apache/kafka/blob/84caaa6e9da06435411510a81fa321d4f99c351f/clients/src/main/resources/common/message/ApiVersionsResponse.json#L24
                if (hasResponseHeaderTaggedFields) {
                    this.#responseReader.skip(EMPTY_OR_SINGLE_COMPACT_LENGTH_SIZE);
                }
                deserialized = parser(correlationId, apiKey, apiVersion, new Reader(this.#responseReader.buffer.subarray(this.#responseReader.position, this.#nextMessage + INT32_SIZE)));
            }
            catch (error) {
                responseError = error;
                // debugDump(Date.now() % 100000, 'received error', {
                //   owner: this.#ownerId,
                //   apiKey: protocolAPIsById[apiKey],
                //   error
                // })
            }
            finally {
                this.#responseBuffer.consume(this.#nextMessage + INT32_SIZE);
                this.#responseReader.position = 0;
                this.#nextMessage = -1;
            }
            // debugDump(Date.now() % 100000, 'receive', {
            //   owner: this.#ownerId,
            //   apiKey: protocolAPIsById[apiKey],
            //   correlationId
            // })
            loggers.protocol('Received response.', { apiKey: protocolAPIsById[apiKey], correlationId, request, deserialized });
            if (responseError) {
                request.diagnostic.error = responseError;
                connectionsApiChannel.error.publish(request.diagnostic);
            }
            else {
                request.diagnostic.result = deserialized;
            }
            connectionsApiChannel.asyncStart.publish(request.diagnostic);
            callback(responseError, deserialized);
            connectionsApiChannel.asyncEnd.publish(request.diagnostic);
        }
    }
    #onDrain() {
        // First of all, send all the requests that were waiting for the socket to drain
        while (this.#afterDrainRequests.length) {
            const request = this.#afterDrainRequests.shift();
            // If no more request or  after sending the request the socket is blocked again, abort
            if (!request || !this.#sendRequest(request)) {
                return;
            }
        }
        // Start getting requests again
        this.#socketMustBeDrained = false;
        this.emit('drain');
    }
    #onClose() {
        this.#status = ConnectionStatuses.CLOSED;
        this.emit('close');
        const error = new NetworkError('Connection closed');
        for (const request of this.#afterDrainRequests) {
            const payload = request.payload();
            if (!payload.context.noResponse) {
                request.callback(error, undefined);
            }
        }
        for (const inflight of this.#inflightRequests.values()) {
            inflight.callback(error, undefined);
        }
    }
    #onError(error) {
        this.emit('error', new NetworkError('Connection error', { cause: error }));
    }
}
