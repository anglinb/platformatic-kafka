import { type TracingChannel } from 'node:diagnostics_channel';
import { type Base } from './clients/base/base.ts';
import { type ConnectionPool } from './network/connection-pool.ts';
import { type Connection } from './network/connection.ts';
export type ClientType = 'base' | 'producer' | 'consumer' | 'admin';
export interface CreationEvent<InstanceType> {
    type: ClientType | 'connection' | 'connectionPool';
    instance: InstanceType;
}
export type ConnectionDiagnosticEvent<Attributes = Record<string, unknown>> = {
    connection: Connection;
} & Attributes;
export type ConnectionPoolDiagnosticEvent<Attributes = Record<string, unknown>> = {
    connectionPool: ConnectionPool;
} & Attributes;
export type ClientDiagnosticEvent<InstanceType extends Base = Base, Attributes = Record<string, unknown>> = {
    client: InstanceType;
} & Attributes;
export type TracingChannelWithName<EventType extends object> = TracingChannel<string, EventType> & {
    name: string;
};
export type DiagnosticContext<BaseContext = {}> = BaseContext & {
    operationId: bigint;
    result?: unknown;
    error?: unknown;
};
export declare const channelsNamespace: "plt:kafka";
export declare function createDiagnosticContext<BaseContext = {}>(context: BaseContext): DiagnosticContext<BaseContext>;
export declare function notifyCreation<InstanceType>(type: ClientType | 'connection' | 'connection-pool' | 'messages-stream', instance: InstanceType): void;
export declare function createTracingChannel<DiagnosticEvent extends object>(name: string): TracingChannelWithName<DiagnosticEvent>;
export declare const instancesChannel: import("diagnostics_channel").Channel<unknown, unknown>;
export declare const connectionsConnectsChannel: TracingChannelWithName<ConnectionDiagnosticEvent<Record<string, unknown>>>;
export declare const connectionsApiChannel: TracingChannelWithName<ConnectionDiagnosticEvent<Record<string, unknown>>>;
export declare const connectionsPoolGetsChannel: TracingChannelWithName<ConnectionPoolDiagnosticEvent<Record<string, unknown>>>;
export declare const baseApisChannel: TracingChannelWithName<ClientDiagnosticEvent<Base<import("./index.ts").BaseOptions>, Record<string, unknown>>>;
export declare const baseMetadataChannel: TracingChannelWithName<ClientDiagnosticEvent<Base<import("./index.ts").BaseOptions>, Record<string, unknown>>>;
export declare const adminTopicsChannel: TracingChannelWithName<ClientDiagnosticEvent<Base<import("./index.ts").BaseOptions>, Record<string, unknown>>>;
export declare const adminGroupsChannel: TracingChannelWithName<ClientDiagnosticEvent<Base<import("./index.ts").BaseOptions>, Record<string, unknown>>>;
export declare const producerInitIdempotentChannel: TracingChannelWithName<ClientDiagnosticEvent<Base<import("./index.ts").BaseOptions>, Record<string, unknown>>>;
export declare const producerSendsChannel: TracingChannelWithName<ClientDiagnosticEvent<Base<import("./index.ts").BaseOptions>, Record<string, unknown>>>;
export declare const consumerGroupChannel: TracingChannelWithName<ClientDiagnosticEvent<Base<import("./index.ts").BaseOptions>, Record<string, unknown>>>;
export declare const consumerHeartbeatChannel: TracingChannelWithName<ClientDiagnosticEvent<Base<import("./index.ts").BaseOptions>, Record<string, unknown>>>;
export declare const consumerReceivesChannel: TracingChannelWithName<ClientDiagnosticEvent<Base<import("./index.ts").BaseOptions>, Record<string, unknown>>>;
export declare const consumerFetchesChannel: TracingChannelWithName<ClientDiagnosticEvent<Base<import("./index.ts").BaseOptions>, Record<string, unknown>>>;
export declare const consumerConsumesChannel: TracingChannelWithName<ClientDiagnosticEvent<Base<import("./index.ts").BaseOptions>, Record<string, unknown>>>;
export declare const consumerCommitsChannel: TracingChannelWithName<ClientDiagnosticEvent<Base<import("./index.ts").BaseOptions>, Record<string, unknown>>>;
export declare const consumerOffsetsChannel: TracingChannelWithName<ClientDiagnosticEvent<Base<import("./index.ts").BaseOptions>, Record<string, unknown>>>;
