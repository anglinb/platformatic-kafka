import { type NullableString } from '../../protocol/definitions.ts';
import { type Reader } from '../../protocol/reader.ts';
import { Writer } from '../../protocol/writer.ts';
export interface LeaveGroupRequestMember {
    memberId: string;
    groupInstanceId?: NullableString;
    reason?: NullableString;
}
export type LeaveGroupRequest = Parameters<typeof createRequest>;
export interface LeaveGroupResponseMember {
    memberId: NullableString;
    groupInstanceId: NullableString;
    errorCode: number;
}
export interface LeaveGroupResponse {
    throttleTimeMs: number;
    errorCode: number;
    members: LeaveGroupResponseMember[];
}
export declare function createRequest(groupId: string, members: LeaveGroupRequestMember[]): Writer;
export declare function parseResponse(_correlationId: number, apiKey: number, apiVersion: number, reader: Reader): LeaveGroupResponse;
export declare const api: import("../definitions.ts").API<[groupId: string, members: LeaveGroupRequestMember[]], LeaveGroupResponse>;
