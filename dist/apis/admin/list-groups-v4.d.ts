import { type Reader } from '../../protocol/reader.ts';
import { Writer } from '../../protocol/writer.ts';
import { type ConsumerGroupState } from '../enumerations.ts';
export type ListGroupsRequest = Parameters<typeof createRequest>;
export interface ListGroupsResponseGroup {
    groupId: string;
    protocolType: string;
    groupState: string;
}
export interface ListGroupsResponse {
    throttleTimeMs: number;
    errorCode: number;
    groups: ListGroupsResponseGroup[];
}
export declare function createRequest(statesFilter: ConsumerGroupState[]): Writer;
export declare function parseResponse(_correlationId: number, apiKey: number, apiVersion: number, reader: Reader): ListGroupsResponse;
export declare const api: import("../definitions.ts").API<[statesFilter: ("PREPARING_REBALANCE" | "COMPLETING_REBALANCE" | "STABLE" | "DEAD" | "EMPTY")[]], ListGroupsResponse>;
