import { type NullableString } from '../../protocol/definitions.ts';
import { type Reader } from '../../protocol/reader.ts';
import { Writer } from '../../protocol/writer.ts';
export type DescribeAclsRequest = Parameters<typeof createRequest>;
export interface DescribeAclsResponseAcl {
    principal: string;
    host: string;
    operation: number;
    permissionType: number;
}
export interface DescribeAclsResponseResource {
    resourceType: number;
    resourceName: string;
    patternType: number;
    acls: DescribeAclsResponseAcl[];
}
export interface DescribeAclsResponse {
    throttleTimeMs: number;
    errorCode: number;
    errorMessage: NullableString;
    resources: DescribeAclsResponseResource[];
}
export declare function createRequest(resourceTypeFilter: number, resourceNameFilter: NullableString, patternTypeFilter: number, principalFilter: NullableString, hostFilter: NullableString, operation: number, permissionType: number): Writer;
export declare function parseResponse(_correlationId: number, apiKey: number, apiVersion: number, reader: Reader): DescribeAclsResponse;
export declare const api: import("../definitions.ts").API<[resourceTypeFilter: number, resourceNameFilter: NullableString, patternTypeFilter: number, principalFilter: NullableString, hostFilter: NullableString, operation: number, permissionType: number], DescribeAclsResponse>;
