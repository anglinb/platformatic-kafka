import { type NullableString } from '../../protocol/definitions.ts';
import { type Reader } from '../../protocol/reader.ts';
import { Writer } from '../../protocol/writer.ts';
export interface ConsumerGroupHeartbeatRequestTopicPartition {
    topicId: string;
    partitions: number[];
}
export type ConsumerGroupHeartbeatRequest = Parameters<typeof createRequest>;
export interface ConsumerGroupHeartbeatResponseAssignmentTopicPartition {
    topicId: string;
    partitions: number[];
}
export interface ConsumerGroupHeartbeatResponseAssignment {
    topicPartitions: ConsumerGroupHeartbeatResponseAssignmentTopicPartition[];
}
export interface ConsumerGroupHeartbeatResponse {
    throttleTimeMs: number;
    errorCode: number;
    errorMessage: NullableString;
    memberId: NullableString;
    memberEpoch: number;
    heartbeatIntervalMs: number;
    assignment: ConsumerGroupHeartbeatResponseAssignment[];
}
export declare function createRequest(groupId: string, memberId: string, memberEpoch: number, instanceId: NullableString, rackId: NullableString, rebalanceTimeoutMs: number, subscribedTopicNames: string[] | null, serverAssignor: NullableString, topicPartitions: ConsumerGroupHeartbeatRequestTopicPartition[]): Writer;
export declare function parseResponse(_correlationId: number, apiKey: number, apiVersion: number, reader: Reader): ConsumerGroupHeartbeatResponse;
export declare const api: import("../definitions.ts").API<[groupId: string, memberId: string, memberEpoch: number, instanceId: NullableString, rackId: NullableString, rebalanceTimeoutMs: number, subscribedTopicNames: string[] | null, serverAssignor: NullableString, topicPartitions: ConsumerGroupHeartbeatRequestTopicPartition[]], ConsumerGroupHeartbeatResponse>;
