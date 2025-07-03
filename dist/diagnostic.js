import { channel, tracingChannel } from 'node:diagnostics_channel';
export const channelsNamespace = 'plt:kafka';
let operationId = 0n;
export function createDiagnosticContext(context) {
    return { operationId: operationId++, ...context };
}
export function notifyCreation(type, instance) {
    instancesChannel.publish({ type, instance });
}
export function createTracingChannel(name) {
    name = `${channelsNamespace}:${name}`;
    const channel = tracingChannel(name);
    channel.name = name;
    return channel;
}
// Generic channel for objects creation
export const instancesChannel = channel(`${channelsNamespace}:instances`);
// Connection related channels
export const connectionsConnectsChannel = createTracingChannel('connections:connects');
export const connectionsApiChannel = createTracingChannel('connections:api');
export const connectionsPoolGetsChannel = createTracingChannel('connections:pool:get');
// Base channels
export const baseApisChannel = createTracingChannel('base:apis');
export const baseMetadataChannel = createTracingChannel('base:metadata');
// Admin channels
export const adminTopicsChannel = createTracingChannel('admin:topics');
export const adminGroupsChannel = createTracingChannel('admin:groups');
// Producer channels
export const producerInitIdempotentChannel = createTracingChannel('producer:initIdempotent');
export const producerSendsChannel = createTracingChannel('producer:sends');
// Consumer channels
export const consumerGroupChannel = createTracingChannel('consumer:group');
export const consumerHeartbeatChannel = createTracingChannel('consumer:heartbeat');
export const consumerReceivesChannel = createTracingChannel('consumer:receives');
export const consumerFetchesChannel = createTracingChannel('consumer:fetches');
export const consumerConsumesChannel = createTracingChannel('consumer:consumes');
export const consumerCommitsChannel = createTracingChannel('consumer:commits');
export const consumerOffsetsChannel = createTracingChannel('consumer:offsets');
