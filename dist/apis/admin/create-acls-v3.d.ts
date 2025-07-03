import { type NullableString } from '../../protocol/definitions.ts';
import { type Reader } from '../../protocol/reader.ts';
import { Writer } from '../../protocol/writer.ts';
export interface CreateAclsRequestCreation {
    resourceType: number;
    resourceName: string;
    resourcePatternType: number;
    principal: string;
    host: string;
    operation: number;
    permissionType: number;
}
export type CreateAclsRequest = Parameters<typeof createRequest>;
export interface CreateAclsResponseResult {
    errorCode: number;
    errorMessage: NullableString;
}
export interface CreateAclsResponse {
    throttleTimeMs: number;
    results: CreateAclsResponseResult[];
}
export declare function createRequest(creations: CreateAclsRequestCreation[]): Writer;
export declare function parseResponse(_correlationId: number, apiKey: number, apiVersion: number, reader: Reader): CreateAclsResponse;
export declare const api: import("../definitions.ts").API<[creations: CreateAclsRequestCreation[]], CreateAclsResponse>;
