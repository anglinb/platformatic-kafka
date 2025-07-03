import EventEmitter from 'node:events';
import { type Socket } from 'node:net';
import { type ConnectionOptions as TLSConnectionOptions } from 'node:tls';
import { type CallbackWithPromise } from '../apis/callbacks.ts';
import { type Callback, type ResponseParser } from '../apis/definitions.ts';
import { type SASLMechanism } from '../apis/enumerations.ts';
import { Writer } from '../protocol/writer.ts';
export interface Broker {
    host: string;
    port: number;
}
export interface SASLOptions {
    mechanism: SASLMechanism;
    username: string;
    password: string;
}
export interface ConnectionOptions {
    connectTimeout?: number;
    maxInflights?: number;
    tls?: TLSConnectionOptions;
    tlsServerName?: string | boolean;
    sasl?: SASLOptions;
    ownerId?: number;
}
export interface Request {
    correlationId: number;
    apiKey: number;
    apiVersion: number;
    hasRequestHeaderTaggedFields: boolean;
    hasResponseHeaderTaggedFields: boolean;
    payload: () => Writer;
    parser: ResponseParser<unknown>;
    callback: Callback<any>;
    diagnostic: Record<string, unknown>;
}
export declare const ConnectionStatuses: {
    readonly NONE: "none";
    readonly CONNECTING: "connecting";
    readonly AUTHENTICATING: "authenticating";
    readonly CONNECTED: "connected";
    readonly CLOSED: "closed";
    readonly CLOSING: "closing";
    readonly ERROR: "error";
};
export type ConnectionStatus = keyof typeof ConnectionStatuses;
export type ConnectionStatusValue = (typeof ConnectionStatuses)[keyof typeof ConnectionStatuses];
export declare const defaultOptions: ConnectionOptions;
export declare class Connection extends EventEmitter {
    #private;
    constructor(clientId?: string, options?: ConnectionOptions);
    get host(): string | undefined;
    get port(): number | undefined;
    get instanceId(): number;
    get status(): ConnectionStatusValue;
    get socket(): Socket;
    connect(host: string, port: number, callback?: CallbackWithPromise<void>): void | Promise<void>;
    ready(callback: CallbackWithPromise<void>): void;
    ready(): Promise<void>;
    close(callback: CallbackWithPromise<void>): void;
    close(): Promise<void>;
    send<ReturnType>(apiKey: number, apiVersion: number, payload: () => Writer, responseParser: ResponseParser<ReturnType>, hasRequestHeaderTaggedFields: boolean, hasResponseHeaderTaggedFields: boolean, callback: Callback<ReturnType>): void;
}
