import { type NullableString } from '../../protocol/definitions.ts';
import { type Reader } from '../../protocol/reader.ts';
import { Writer } from '../../protocol/writer.ts';
export interface DeleteAclsRequestFilter {
    resourceTypeFilter: number;
    resourceNameFilter?: NullableString;
    patternTypeFilter: number;
    principalFilter?: NullableString;
    hostFilter?: NullableString;
    operation: number;
    permissionType: number;
}
export type DeleteAclsRequest = Parameters<typeof createRequest>;
export interface DeleteAclsResponseMatchingAcl {
    errorCode: number;
    errorMessage: NullableString;
    resourceType: number;
    resourceName: string;
    patternType: number;
    principal: string;
    host: string;
    operation: number;
    permissionType: number;
}
export interface DeleteAclsResponseFilterResults {
    errorCode: number;
    errorMessage: NullableString;
    matchingAcls: DeleteAclsResponseMatchingAcl[];
}
export interface DeleteAclsResponse {
    throttleTimeMs: number;
    filterResults: DeleteAclsResponseFilterResults[];
}
export declare function createRequest(filters: DeleteAclsRequestFilter[]): Writer;
export declare function parseResponse(_correlationId: number, apiKey: number, apiVersion: number, reader: Reader): DeleteAclsResponse;
export declare const api: import("../definitions.ts").API<[filters: DeleteAclsRequestFilter[]], DeleteAclsResponse>;
