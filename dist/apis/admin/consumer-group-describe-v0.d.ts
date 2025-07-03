import { type NullableString } from '../../protocol/definitions.ts';
import { type Reader } from '../../protocol/reader.ts';
import { Writer } from '../../protocol/writer.ts';
export type ConsumerGroupDescribeRequest = Parameters<typeof createRequest>;
export interface ConsumerGroupDescribeResponseMemberTopic {
    topicId: string;
    topicName: string;
    partitions: number[];
}
export interface ConsumerGroupDescribeResponseMemberAssignment {
    topicPartitions: ConsumerGroupDescribeResponseMemberTopic[];
}
export interface ConsumerGroupDescribeResponseMember {
    memberId: string;
    instanceId: NullableString;
    rackId: NullableString;
    memberEpoch: number;
    clientId: string;
    clientHost: string;
    subscribedTopicNames: string;
    subscribedTopicRegex: NullableString;
    assignment: ConsumerGroupDescribeResponseMemberAssignment;
    targetAssignment: ConsumerGroupDescribeResponseMemberAssignment;
}
export interface ConsumerGroupDescribeResponseGroup {
    errorCode: number;
    errorMessage: NullableString;
    groupId: string;
    groupState: string;
    groupEpoch: number;
    assignmentEpoch: number;
    assignorName: string;
    members: ConsumerGroupDescribeResponseMember[];
}
export interface ConsumerGroupDescribeResponse {
    throttleTimeMs: number;
    groups: ConsumerGroupDescribeResponseGroup[];
}
export declare function createRequest(groupIds: string[], includeAuthorizedOperations: boolean): Writer;
export declare function parseResponse(_correlationId: number, apiKey: number, apiVersion: number, reader: Reader): ConsumerGroupDescribeResponse;
export declare const api: import("../definitions.ts").API<[groupIds: string[], includeAuthorizedOperations: boolean], ConsumerGroupDescribeResponse>;
