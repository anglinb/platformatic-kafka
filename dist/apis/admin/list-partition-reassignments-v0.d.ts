import { type NullableString } from '../../protocol/definitions.ts';
import { type Reader } from '../../protocol/reader.ts';
import { Writer } from '../../protocol/writer.ts';
export interface ListPartitionReassignmentsRequestTopic {
    name: string;
    partitionIndexes: number[];
}
export type ListPartitionReassignmentsRequest = Parameters<typeof createRequest>;
export interface ListPartitionReassignmentsResponsePartition {
    partitionIndex: number;
    replicas: number[];
    addingReplicas: number[];
    removingReplicas: number[];
}
export interface ListPartitionReassignmentsResponseTopic {
    name: string;
    partitions: ListPartitionReassignmentsResponsePartition[];
}
export interface ListPartitionReassignmentsResponse {
    throttleTimeMs: number;
    errorCode: number;
    errorMessage: NullableString;
    topics: ListPartitionReassignmentsResponseTopic[];
}
export declare function createRequest(timeoutMs: number, topics: ListPartitionReassignmentsRequestTopic[]): Writer;
export declare function parseResponse(_correlationId: number, apiKey: number, apiVersion: number, reader: Reader): ListPartitionReassignmentsResponse;
export declare const api: import("../definitions.ts").API<[timeoutMs: number, topics: ListPartitionReassignmentsRequestTopic[]], ListPartitionReassignmentsResponse>;
