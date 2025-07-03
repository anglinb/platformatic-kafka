import { EventEmitter } from 'node:events';
import { createPromisifiedCallback, kCallbackPromise } from "../../apis/callbacks.js";
import * as apis from "../../apis/index.js";
import { api as apiVersionsV3 } from "../../apis/metadata/api-versions-v3.js";
import { baseApisChannel, baseMetadataChannel, createDiagnosticContext, notifyCreation } from "../../diagnostic.js";
import { MultipleErrors, NetworkError, UnsupportedApiError, UserError } from "../../errors.js";
import { ConnectionPool } from "../../network/connection-pool.js";
import { kInstance } from "../../symbols.js";
import { ajv, debugDump, loggers } from "../../utils.js";
import { baseOptionsValidator, clientSoftwareName, clientSoftwareVersion, defaultBaseOptions, defaultPort, metadataOptionsValidator } from "./options.js";
export const kClientId = Symbol('plt.kafka.base.clientId');
export const kBootstrapBrokers = Symbol('plt.kafka.base.bootstrapBrokers');
export const kApis = Symbol('plt.kafka.base.apis');
export const kGetApi = Symbol('plt.kafka.base.getApi');
export const kGetConnection = Symbol('plt.kafka.base.getConnection');
export const kGetBootstrapConnection = Symbol('plt.kafka.base.getBootstrapConnection');
export const kOptions = Symbol('plt.kafka.base.options');
export const kConnections = Symbol('plt.kafka.base.connections');
export const kFetchConnections = Symbol('plt.kafka.base.fetchCnnections');
export const kCreateConnectionPool = Symbol('plt.kafka.base.createConnectionPool');
export const kClosed = Symbol('plt.kafka.base.closed');
export const kListApis = Symbol('plt.kafka.base.listApis');
export const kMetadata = Symbol('plt.kafka.base.metadata');
export const kCheckNotClosed = Symbol('plt.kafka.base.checkNotClosed');
export const kClearMetadata = Symbol('plt.kafka.base.clearMetadata');
export const kParseBroker = Symbol('plt.kafka.base.parseBroker');
export const kPerformWithRetry = Symbol('plt.kafka.base.performWithRetry');
export const kPerformDeduplicated = Symbol('plt.kafka.base.performDeduplicated');
export const kValidateOptions = Symbol('plt.kafka.base.validateOptions');
export const kInspect = Symbol('plt.kafka.base.inspect');
export const kFormatValidationErrors = Symbol('plt.kafka.base.formatValidationErrors');
export const kPrometheus = Symbol('plt.kafka.base.prometheus');
export const kClientType = Symbol('plt.kafka.base.clientType');
export const kAfterCreate = Symbol('plt.kafka.base.afterCreate');
let currentInstance = 0;
export class Base extends EventEmitter {
    // This is declared using a symbol (a.k.a protected/friend) to make it available in ConnectionPool and MessagesStream
    [kInstance];
    // General status - Use symbols rather than JS private property to make them "protected" as in C++
    [kClientId];
    [kClientType];
    [kBootstrapBrokers];
    [kApis];
    [kOptions];
    [kConnections];
    [kClosed];
    [kPrometheus];
    #metadata;
    #inflightDeduplications;
    #pendingRetryTimeouts;
    constructor(options) {
        super();
        this[kClientType] = 'base';
        this[kInstance] = currentInstance++;
        this[kApis] = [];
        // Validate options
        this[kOptions] = Object.assign({}, defaultBaseOptions, options);
        if (typeof this[kOptions].retries === 'boolean') {
            this[kOptions].retries = this[kOptions].retries ? Number.POSITIVE_INFINITY : 0;
        }
        this[kValidateOptions](this[kOptions], baseOptionsValidator, '/options');
        this[kClientId] = options.clientId;
        // Initialize bootstrap brokers
        this[kBootstrapBrokers] = [];
        for (const broker of options.bootstrapBrokers) {
            this[kBootstrapBrokers].push(this[kParseBroker](broker));
        }
        // Initialize main connection pool
        this[kConnections] = this[kCreateConnectionPool]();
        this[kClosed] = false;
        this.#inflightDeduplications = new Map();
        this.#pendingRetryTimeouts = new Set();
        // Initialize metrics
        if (options.metrics) {
            this[kPrometheus] = options.metrics;
        }
    }
    get instanceId() {
        return this[kInstance];
    }
    get clientId() {
        return this[kClientId];
    }
    get closed() {
        return this[kClosed] === true;
    }
    get type() {
        return this[kClientType];
    }
    emitWithDebug(section, name, ...args) {
        if (!section) {
            return this.emit(name, ...args);
        }
        loggers[section]?.({ event: name, payload: args });
        return this.emit(`${section}:${name}`, ...args);
    }
    close(callback) {
        if (!callback) {
            callback = createPromisifiedCallback();
        }
        this[kClosed] = true;
        // Cancel all pending retry timeouts
        for (const timeout of this.#pendingRetryTimeouts) {
            clearTimeout(timeout);
        }
        this.#pendingRetryTimeouts.clear();
        this[kConnections].close(callback);
        return callback[kCallbackPromise];
    }
    listApis(callback) {
        if (!callback) {
            callback = createPromisifiedCallback();
        }
        baseApisChannel.traceCallback(this[kListApis], 0, createDiagnosticContext({ client: this, operation: 'listApis' }), this, callback);
        return callback[kCallbackPromise];
    }
    metadata(options, callback) {
        if (!callback) {
            callback = createPromisifiedCallback();
        }
        const validationError = this[kValidateOptions](options, metadataOptionsValidator, '/options', false);
        if (validationError) {
            callback(validationError, undefined);
            return callback[kCallbackPromise];
        }
        baseMetadataChannel.traceCallback(this[kMetadata], 1, createDiagnosticContext({ client: this, operation: 'metadata' }), this, options, callback);
        return callback[kCallbackPromise];
    }
    [kCreateConnectionPool]() {
        const pool = new ConnectionPool(this[kClientId], {
            ownerId: this[kInstance],
            ...this[kOptions]
        });
        this.#forwardEvents(pool, ['connect', 'disconnect', 'failed', 'drain', 'sasl:handshake', 'sasl:authentication']);
        return pool;
    }
    [kListApis](callback) {
        this[kPerformDeduplicated]('listApis', deduplicateCallback => {
            this[kPerformWithRetry]('listApis', retryCallback => {
                this[kGetBootstrapConnection]((error, connection) => {
                    if (error) {
                        retryCallback(error, undefined);
                        return;
                    }
                    // We use V3 to be able to get APIS from Kafka 2.4.0+
                    apiVersionsV3(connection, clientSoftwareName, clientSoftwareVersion, retryCallback);
                });
            }, (error, metadata) => {
                if (error) {
                    deduplicateCallback(error, undefined);
                    return;
                }
                deduplicateCallback(null, metadata.apiKeys);
            }, 0);
        }, callback);
    }
    [kMetadata](options, callback) {
        const metadataMaxAge = options.metadataMaxAge ?? this[kOptions].metadataMaxAge;
        const isStale = options.forceUpdate ||
            !this.#metadata ||
            Date.now() > this.#metadata.lastUpdate + metadataMaxAge ||
            options.topics.some(topic => !this.#metadata?.topics.has(topic));
        if (!isStale) {
            callback(null, this.#metadata);
            return;
        }
        const autocreateTopics = options.autocreateTopics ?? this[kOptions].autocreateTopics;
        this[kPerformDeduplicated]('metadata', deduplicateCallback => {
            this[kPerformWithRetry]('metadata', retryCallback => {
                this[kGetBootstrapConnection]((error, connection) => {
                    if (error) {
                        retryCallback(error, undefined);
                        return;
                    }
                    this[kGetApi]('Metadata', (error, api) => {
                        if (error) {
                            retryCallback(error, undefined);
                            return;
                        }
                        api(connection, options.topics, autocreateTopics, true, retryCallback);
                    });
                });
            }, (error, metadata) => {
                if (error) {
                    deduplicateCallback(error, undefined);
                    return;
                }
                const brokers = new Map();
                const topics = new Map();
                for (const broker of metadata.brokers) {
                    const { host, port } = broker;
                    brokers.set(broker.nodeId, { host, port });
                }
                for (const { name, topicId: id, partitions: rawPartitions, isInternal } of metadata.topics) {
                    /* c8 ignore next 3 - Sometimes internal topics might be returned by Kafka */
                    if (isInternal) {
                        continue;
                    }
                    const partitions = [];
                    for (const rawPartition of rawPartitions.sort((a, b) => a.partitionIndex - b.partitionIndex)) {
                        partitions[rawPartition.partitionIndex] = {
                            leader: rawPartition.leaderId,
                            leaderEpoch: rawPartition.leaderEpoch,
                            replicas: rawPartition.replicaNodes
                        };
                    }
                    topics.set(name, { id, partitions, partitionsCount: rawPartitions.length });
                }
                this.#metadata = {
                    id: metadata.clusterId,
                    brokers,
                    topics,
                    lastUpdate: Date.now()
                };
                this.emitWithDebug('client', 'metadata', this.#metadata);
                deduplicateCallback(null, this.#metadata);
            }, 0);
        }, callback);
    }
    [kCheckNotClosed](callback) {
        if (this[kClosed]) {
            const error = new NetworkError('Client is closed.', { closed: true, instance: this[kInstance] });
            callback(error, undefined);
            return true;
        }
        return false;
    }
    [kClearMetadata]() {
        this.#metadata = undefined;
    }
    [kParseBroker](broker) {
        if (typeof broker === 'string') {
            if (broker.includes(':')) {
                const [host, port] = broker.split(':');
                return { host, port: Number(port) };
            }
            else {
                return { host: broker, port: defaultPort };
            }
        }
        return broker;
    }
    [kPerformWithRetry](operationId, operation, callback, attempt = 0, errors = [], shouldSkipRetry) {
        // Check if client is closed before attempting operation
        if (this[kClosed]) {
            callback(new NetworkError('Client is closed.', { closed: true, instance: this[kInstance] }), undefined);
            return callback[kCallbackPromise];
        }
        const retries = this[kOptions].retries;
        this.emitWithDebug('client', 'performWithRetry', operationId, attempt, retries);
        operation((error, result) => {
            if (error) {
                const genericError = error;
                const retriable = genericError.findBy?.('code', NetworkError.code) || genericError.findBy?.('canRetry', true);
                errors.push(error);
                if (attempt < retries && retriable && !shouldSkipRetry?.(error) && !this[kClosed]) {
                    const timeout = setTimeout(() => {
                        this.#pendingRetryTimeouts.delete(timeout);
                        // Check again if client is closed before retrying
                        if (this[kClosed]) {
                            callback(new NetworkError('Client is closed.', { closed: true, instance: this[kInstance] }), undefined);
                            return;
                        }
                        this[kPerformWithRetry](operationId, operation, callback, attempt + 1, errors, shouldSkipRetry);
                    }, this[kOptions].retryDelay);
                    this.#pendingRetryTimeouts.add(timeout);
                }
                else {
                    if (attempt === 0) {
                        callback(error, undefined);
                        return;
                    }
                    callback(new MultipleErrors(`${operationId} failed ${attempt + 1} times.`, errors), undefined);
                }
                return;
            }
            callback(null, result);
        });
        return callback[kCallbackPromise];
    }
    [kPerformDeduplicated](operationId, operation, callback) {
        let inflights = this.#inflightDeduplications.get(operationId);
        if (!inflights) {
            inflights = [];
            this.#inflightDeduplications.set(operationId, inflights);
        }
        inflights.push(callback);
        if (inflights.length === 1) {
            this.emitWithDebug('client', 'performDeduplicated', operationId);
            operation((error, result) => {
                this.#inflightDeduplications.set(operationId, []);
                for (const cb of inflights) {
                    cb(error, result);
                }
                inflights = [];
            });
        }
        return callback[kCallbackPromise];
    }
    [kGetApi](name, callback) {
        // Make sure we have APIs informations
        if (!this[kApis].length) {
            this[kListApis]((error, apis) => {
                if (error) {
                    callback(error, undefined);
                    return;
                }
                this[kApis] = apis;
                this[kGetApi](name, callback);
            });
            return;
        }
        const api = this[kApis].find(api => api.name === name);
        if (!api) {
            callback(new UnsupportedApiError(`Unsupported API ${name}.`), undefined);
            return;
        }
        const { minVersion, maxVersion } = api;
        // Starting from the highest version, we need to find the first one that is supported
        for (let i = maxVersion; i >= minVersion; i--) {
            const apiName = (name.slice(0, 1).toLowerCase() + name.slice(1) + 'V' + i);
            const candidate = apis[apiName];
            if (candidate) {
                callback(null, candidate.api);
                return;
            }
        }
        callback(new UnsupportedApiError(`No usable implementation found for API ${name}.`, { minVersion, maxVersion }), undefined);
    }
    [kGetConnection](broker, callback) {
        this[kConnections].get(broker, callback);
    }
    [kGetBootstrapConnection](callback) {
        this[kConnections].getFirstAvailable(this[kBootstrapBrokers], callback);
    }
    [kValidateOptions](target, validator, targetName, throwOnErrors = true) {
        if (!this[kOptions].strict) {
            return null;
        }
        const valid = validator(target);
        if (!valid) {
            const error = new UserError(this[kFormatValidationErrors](validator, targetName));
            if (throwOnErrors) {
                throw error;
            }
            return error;
        }
        return null;
    }
    /* c8 ignore next 3 -- This is a private API used to debug during development */
    [kInspect](...args) {
        debugDump(`client:${this[kInstance]}`, ...args);
    }
    [kFormatValidationErrors](validator, targetName) {
        return ajv.errorsText(validator.errors, { dataVar: '$dataVar$' }).replaceAll('$dataVar$', targetName) + '.';
    }
    [kAfterCreate](type) {
        this[kClientType] = type;
        notifyCreation(type, this);
    }
    #forwardEvents(source, events) {
        for (const event of events) {
            source.on(event, (...args) => {
                this.emitWithDebug('client', `broker:${event}`, ...args);
            });
        }
    }
}
