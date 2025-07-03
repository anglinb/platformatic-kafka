import EventEmitter from 'node:events';
import { createPromisifiedCallback, kCallbackPromise, runConcurrentCallbacks } from "../apis/callbacks.js";
import { connectionsPoolGetsChannel, createDiagnosticContext, notifyCreation } from "../diagnostic.js";
import { MultipleErrors } from "../errors.js";
import { Connection, ConnectionStatuses } from "./connection.js";
let currentInstance = 0;
export class ConnectionPool extends EventEmitter {
    #instanceId;
    #clientId;
    // @ts-ignore This is used just for debugging
    #ownerId;
    #connections;
    #connectionOptions;
    #closed;
    constructor(clientId, connectionOptions = {}) {
        super();
        this.#instanceId = currentInstance++;
        this.#clientId = clientId;
        this.#ownerId = connectionOptions.ownerId;
        this.#connections = new Map();
        this.#connectionOptions = connectionOptions;
        this.#closed = false;
        notifyCreation('connection-pool', this);
    }
    get instanceId() {
        return this.#instanceId;
    }
    get(broker, callback) {
        if (!callback) {
            callback = createPromisifiedCallback();
        }
        connectionsPoolGetsChannel.traceCallback(this.#get, 1, createDiagnosticContext({ connectionPool: this, broker, operation: 'get' }), this, broker, callback);
        return callback[kCallbackPromise];
    }
    getFirstAvailable(brokers, callback) {
        if (!callback) {
            callback = createPromisifiedCallback();
        }
        connectionsPoolGetsChannel.traceCallback(this.#getFirstAvailable, 3, createDiagnosticContext({ connectionPool: this, brokers, operation: 'getFirstAvailable' }), this, brokers, 0, [], callback);
        return callback[kCallbackPromise];
    }
    close(callback) {
        if (!callback) {
            callback = createPromisifiedCallback();
        }
        this.#closed = true;
        if (this.#connections.size === 0) {
            callback(null);
            return callback[kCallbackPromise];
        }
        runConcurrentCallbacks('Closing connections failed.', this.#connections, ([key, connection], cb) => {
            connection.close(cb);
            this.#connections.delete(key);
        }, error => callback(error));
        return callback[kCallbackPromise];
    }
    #get(broker, callback) {
        if (this.#closed) {
            callback(new Error('Connection pool is closed'), undefined);
            return;
        }
        const key = `${broker.host}:${broker.port}`;
        const existing = this.#connections.get(key);
        if (existing) {
            if (existing.status !== ConnectionStatuses.CONNECTED) {
                existing.ready(error => {
                    if (error) {
                        callback(error, undefined);
                        return;
                    }
                    callback(null, existing);
                });
            }
            else {
                callback(null, existing);
            }
            return;
        }
        const connection = new Connection(this.#clientId, this.#connectionOptions);
        this.#connections.set(key, connection);
        const eventPayload = { broker, connection };
        this.emit('connecting', eventPayload);
        connection.connect(broker.host, broker.port, error => {
            if (error) {
                this.#connections.delete(key);
                this.emit('failed', eventPayload);
                callback(error, undefined);
                return;
            }
            this.emit('connect', eventPayload);
            callback(null, connection);
        });
        connection.on('sasl:handshake', mechanisms => {
            this.emit('sasl:handshake', { ...eventPayload, mechanisms });
        });
        connection.on('sasl:authentication', authentication => {
            this.emit('sasl:authentication', { ...eventPayload, authentication });
        });
        // Remove stale connections from the pool
        connection.once('close', () => {
            this.emit('disconnect', eventPayload);
            this.#connections.delete(key);
        });
        connection.once('error', () => {
            this.#connections.delete(key);
        });
        connection.on('drain', () => {
            this.emit('drain', eventPayload);
        });
    }
    #getFirstAvailable(brokers, current = 0, errors = [], callback) {
        if (this.#closed) {
            callback(new Error('Connection pool is closed'), undefined);
            return;
        }
        this.get(brokers[current], (error, connection) => {
            if (error) {
                errors.push(error);
                if (current === brokers.length - 1) {
                    callback(new MultipleErrors('Cannot connect to any broker.', errors), undefined);
                    return;
                }
                this.#getFirstAvailable(brokers, current + 1, errors, callback);
                return;
            }
            callback(null, connection);
        });
    }
}
