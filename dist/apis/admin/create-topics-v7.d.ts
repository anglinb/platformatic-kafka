import { type NullableString } from '../../protocol/definitions.ts';
import { type Reader } from '../../protocol/reader.ts';
import { Writer } from '../../protocol/writer.ts';
export interface CreateTopicsRequestTopicAssignment {
    partitionIndex: number;
    brokerIds: number[];
}
export interface CreateTopicsRequestTopicConfig {
    name: string;
    value?: NullableString;
}
export interface CreateTopicsRequestTopic {
    name: string;
    numPartitions: number;
    replicationFactor: number;
    assignments: CreateTopicsRequestTopicAssignment[];
    configs: CreateTopicsRequestTopicConfig[];
}
export type CreateTopicsRequest = Parameters<typeof createRequest>;
export interface CreateTopicsResponseTopicConfig {
    name: string;
    value: NullableString;
    readOnly: boolean;
    configSource: number;
    isSensitive: boolean;
}
export interface CreateTopicsResponseTopic {
    name: string;
    topicId: string;
    errorCode: number;
    errorMessage: NullableString;
    numPartitions: number;
    replicationFactor: number;
    configs: CreateTopicsResponseTopicConfig[];
}
export interface CreateTopicsResponse {
    throttleTimeMs: number;
    topics: CreateTopicsResponseTopic[];
}
export declare function createRequest(topics: CreateTopicsRequestTopic[], timeoutMs: number, validateOnly: boolean): Writer;
export declare function parseResponse(_correlationId: number, apiKey: number, apiVersion: number, reader: Reader): CreateTopicsResponse;
export declare const api: import("../definitions.ts").API<[topics: CreateTopicsRequestTopic[], timeoutMs: number, validateOnly: boolean], CreateTopicsResponse>;
