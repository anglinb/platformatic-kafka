import EventEmitter from 'node:events';
import { type CallbackWithPromise } from '../apis/callbacks.ts';
import { Connection, type Broker, type ConnectionOptions } from './connection.ts';
export declare class ConnectionPool extends EventEmitter {
    #private;
    constructor(clientId: string, connectionOptions?: ConnectionOptions);
    get instanceId(): number;
    get(broker: Broker, callback: CallbackWithPromise<Connection>): void;
    get(broker: Broker): Promise<Connection>;
    getFirstAvailable(brokers: Broker[], callback: CallbackWithPromise<Connection>): void;
    getFirstAvailable(brokers: Broker[]): Promise<Connection>;
    close(callback: CallbackWithPromise<void>): void;
    close(): Promise<void>;
}
