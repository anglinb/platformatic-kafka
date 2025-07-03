import { type NullableString } from '../../protocol/definitions.ts';
import { type Reader } from '../../protocol/reader.ts';
import { Writer } from '../../protocol/writer.ts';
export type MetadataRequest = Parameters<typeof createRequest>;
export interface MetadataResponsePartition {
    errorCode: number;
    partitionIndex: number;
    leaderId: number;
    leaderEpoch: number;
    replicaNodes: number[];
    isrNodes: number[];
    offlineReplicas: number[];
}
export interface MetadataResponseTopic {
    errorCode: number;
    name: NullableString;
    topicId: string;
    isInternal: boolean;
    partitions: MetadataResponsePartition[];
    topicAuthorizedOperations: number;
}
export interface MetadataResponseBroker {
    nodeId: number;
    host: string;
    port: number;
    rack: NullableString;
}
export interface MetadataResponse {
    throttleTimeMs: number;
    brokers: MetadataResponseBroker[];
    clusterId: NullableString;
    controllerId: number;
    topics: MetadataResponseTopic[];
}
export declare function createRequest(topics: string[] | null, allowAutoTopicCreation?: boolean, includeTopicAuthorizedOperations?: boolean): Writer;
export declare function parseResponse(_correlationId: number, apiKey: number, apiVersion: number, reader: Reader): MetadataResponse;
export declare const api: import("../definitions.ts").API<[topics: string[] | null, allowAutoTopicCreation?: boolean | undefined, includeTopicAuthorizedOperations?: boolean | undefined], MetadataResponse>;
