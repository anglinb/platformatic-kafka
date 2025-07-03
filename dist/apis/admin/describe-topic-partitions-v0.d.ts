import { type NullableString } from '../../protocol/definitions.ts';
import { type Reader } from '../../protocol/reader.ts';
import { Writer } from '../../protocol/writer.ts';
export interface DescribeTopicPartitionsRequestTopic {
    name: string;
}
export interface DescribeTopicPartitionsRequestCursor {
    topicName: string;
    partitionIndex: number;
}
export type DescribeTopicPartitionsRequest = Parameters<typeof createRequest>;
export interface DescribeTopicPartitionsResponsePartition {
    errorCode: number;
    partitionIndex: number;
    leaderId: number;
    leaderEpoch: number;
    replicaNodes: number[];
    isrNodes: number[];
    eligibleLeaderReplicas: number[];
    lastKnownElr: number[];
    offlineReplicas: number[];
}
export interface DescribeTopicPartitionsResponseTopic {
    errorCode: number;
    name: NullableString;
    topicId: string;
    isInternal: boolean;
    partitions: DescribeTopicPartitionsResponsePartition[];
    topicAuthorizedOperations: number;
}
export interface DescribeTopicPartitionsResponseCursor {
    topicName: string;
    partitionIndex: number;
}
export interface DescribeTopicPartitionsResponse {
    throttleTimeMs: number;
    topics: DescribeTopicPartitionsResponseTopic[];
    nextCursor?: DescribeTopicPartitionsResponseCursor;
}
export declare function createRequest(topics: DescribeTopicPartitionsRequestTopic[], responsePartitionLimit: number, cursor?: DescribeTopicPartitionsRequestCursor): Writer;
export declare function parseResponse(_correlationId: number, apiKey: number, apiVersion: number, reader: Reader): DescribeTopicPartitionsResponse;
export declare const api: import("../definitions.ts").API<[topics: DescribeTopicPartitionsRequestTopic[], responsePartitionLimit: number, cursor?: DescribeTopicPartitionsRequestCursor | undefined], DescribeTopicPartitionsResponse>;
