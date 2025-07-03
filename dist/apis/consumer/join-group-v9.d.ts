import { type NullableString } from '../../protocol/definitions.ts';
import { type Reader } from '../../protocol/reader.ts';
import { Writer } from '../../protocol/writer.ts';
export interface JoinGroupRequestProtocol {
    name: string;
    metadata?: Buffer | null;
}
export type JoinGroupRequest = Parameters<typeof createRequest>;
export interface JoinGroupResponseMember {
    memberId: string;
    groupInstanceId?: NullableString;
    metadata: Buffer | null;
}
export interface JoinGroupResponse {
    throttleTimeMs: number;
    errorCode: number;
    generationId: number;
    protocolType: NullableString;
    protocolName: NullableString;
    leader: string;
    skipAssignment: boolean;
    memberId: NullableString;
    members: JoinGroupResponseMember[];
}
export declare function createRequest(groupId: string, sessionTimeoutMs: number, rebalanceTimeoutMs: number, memberId: string, groupInstanceId: NullableString, protocolType: string, protocols: JoinGroupRequestProtocol[], reason?: NullableString): Writer;
export declare function parseResponse(_correlationId: number, apiKey: number, apiVersion: number, reader: Reader): JoinGroupResponse;
export declare const api: import("../definitions.ts").API<[groupId: string, sessionTimeoutMs: number, rebalanceTimeoutMs: number, memberId: string, groupInstanceId: NullableString, protocolType: string, protocols: JoinGroupRequestProtocol[], reason?: NullableString], JoinGroupResponse>;
