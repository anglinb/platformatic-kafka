import { type NullableString } from '../../protocol/definitions.ts';
import { type Reader } from '../../protocol/reader.ts';
import { Writer } from '../../protocol/writer.ts';
export interface AlterPartitionReassignmentsRequestPartition {
    partitionIndex: number;
    replicas: number[];
}
export interface AlterPartitionReassignmentsRequestTopic {
    name: string;
    partitions: AlterPartitionReassignmentsRequestPartition[];
}
export type AlterPartitionReassignmentsRequest = Parameters<typeof createRequest>;
export interface AlterPartitionReassignmentsResponsePartition {
    partitionIndex: number;
    errorCode: number;
    errorMessage: NullableString;
}
export interface AlterPartitionReassignmentsResponseResponse {
    name: string;
    partitions: AlterPartitionReassignmentsResponsePartition[];
}
export interface AlterPartitionReassignmentsResponse {
    throttleTimeMs: number;
    errorCode: number;
    errorMessage: NullableString;
    responses: AlterPartitionReassignmentsResponseResponse[];
}
export declare function createRequest(timeoutMs: number, topics: AlterPartitionReassignmentsRequestTopic[]): Writer;
export declare function parseResponse(_correlationId: number, apiKey: number, apiVersion: number, reader: Reader): AlterPartitionReassignmentsResponse;
export declare const api: import("../definitions.ts").API<[timeoutMs: number, topics: AlterPartitionReassignmentsRequestTopic[]], AlterPartitionReassignmentsResponse>;
