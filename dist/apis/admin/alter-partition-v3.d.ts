import { type Reader } from '../../protocol/reader.ts';
import { Writer } from '../../protocol/writer.ts';
export interface AlterPartitionRequestISR {
    brokerId: number;
    brokerEpoch: bigint;
}
export interface AlterPartitionRequestPartition {
    partitionIndex: number;
    leaderEpoch: number;
    newIsrWithEpochs: AlterPartitionRequestISR[];
    leaderRecoveryState: number;
    partitionEpoch: number;
}
export interface AlterPartitionRequestTopic {
    topicId: string;
    partitions: AlterPartitionRequestPartition[];
}
export type AlterPartitionRequest = Parameters<typeof createRequest>;
export interface AlterPartitionResponsePartition {
    partitionIndex: number;
    errorCode: number;
    leaderId: number;
    leaderEpoch: number;
    isr: number;
    leaderRecoveryState: number;
    partitionEpoch: number;
}
export interface AlterPartitionResponseTopic {
    topicId: string;
    partitions: AlterPartitionResponsePartition[];
}
export interface AlterPartitionResponse {
    throttleTimeMs: number;
    errorCode: number;
    topics: AlterPartitionResponseTopic[];
}
export declare function createRequest(brokerId: number, brokerEpoch: bigint, topic: AlterPartitionRequestTopic[]): Writer;
export declare function parseResponse(_correlationId: number, apiKey: number, apiVersion: number, reader: Reader): AlterPartitionResponse;
export declare const api: import("../definitions.ts").API<[brokerId: number, brokerEpoch: bigint, topic: AlterPartitionRequestTopic[]], AlterPartitionResponse>;
