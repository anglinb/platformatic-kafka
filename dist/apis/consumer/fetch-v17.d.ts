import { Reader } from '../../protocol/reader.ts';
import { type RecordsBatch } from '../../protocol/records.ts';
import { Writer } from '../../protocol/writer.ts';
export interface FetchRequestPartition {
    partition: number;
    currentLeaderEpoch: number;
    fetchOffset: bigint;
    lastFetchedEpoch: number;
    partitionMaxBytes: number;
}
export interface FetchRequestTopic {
    topicId: string;
    partitions: FetchRequestPartition[];
}
export interface FetchRequestForgottenTopicsData {
    topic: string;
    partitions: number[];
}
export type FetchRequest = Parameters<typeof createRequest>;
export interface FetchResponsePartitionAbortedTransaction {
    producerId: bigint;
    firstOffset: bigint;
}
export interface FetchResponsePartition {
    partitionIndex: number;
    errorCode: number;
    highWatermark: bigint;
    lastStableOffset: bigint;
    logStartOffset: bigint;
    abortedTransactions: FetchResponsePartitionAbortedTransaction[];
    preferredReadReplica: number;
    records?: RecordsBatch;
}
export interface FetchResponseTopic {
    topicId: string;
    partitions: FetchResponsePartition[];
}
export type FetchResponse = {
    throttleTimeMs: number;
    errorCode: number;
    sessionId: number;
    responses: FetchResponseTopic[];
};
export declare function createRequest(maxWaitMs: number, minBytes: number, maxBytes: number, isolationLevel: number, sessionId: number, sessionEpoch: number, topics: FetchRequestTopic[], forgottenTopicsData: FetchRequestForgottenTopicsData[], rackId: string): Writer;
export declare function parseResponse(_correlationId: number, apiKey: number, apiVersion: number, reader: Reader): FetchResponse;
export declare const api: import("../definitions.ts").API<[maxWaitMs: number, minBytes: number, maxBytes: number, isolationLevel: number, sessionId: number, sessionEpoch: number, topics: FetchRequestTopic[], forgottenTopicsData: FetchRequestForgottenTopicsData[], rackId: string], FetchResponse>;
