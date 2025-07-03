import { type NullableString } from '../../protocol/definitions.ts';
import { type Reader } from '../../protocol/reader.ts';
import { Writer } from '../../protocol/writer.ts';
export interface OffsetFetchRequestTopic {
    name: string;
    partitionIndexes: number[];
}
export interface OffsetFetchRequestGroup {
    groupId: string;
    memberId?: NullableString;
    memberEpoch: number;
    topics: OffsetFetchRequestTopic[];
}
export type OffsetFetchRequest = Parameters<typeof createRequest>;
export interface OffsetFetchResponsePartition {
    partitionIndex: number;
    committedOffset: bigint;
    committedLeaderEpoch: number;
    metadata: NullableString;
    errorCode: number;
}
export interface OffsetFetchResponseTopic {
    name: string;
    partitions: OffsetFetchResponsePartition[];
}
export interface OffsetFetchResponseGroup {
    groupId: string;
    topics: OffsetFetchResponseTopic[];
    errorCode: number;
}
export interface OffsetFetchResponse {
    throttleTimeMs: number;
    groups: OffsetFetchResponseGroup[];
}
export declare function createRequest(groups: OffsetFetchRequestGroup[], requireStable: boolean): Writer;
export declare function parseResponse(_correlationId: number, apiKey: number, apiVersion: number, reader: Reader): OffsetFetchResponse;
export declare const api: import("../definitions.ts").API<[groups: OffsetFetchRequestGroup[], requireStable: boolean], OffsetFetchResponse>;
