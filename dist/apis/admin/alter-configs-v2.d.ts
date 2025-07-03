import { type NullableString } from '../../protocol/definitions.ts';
import { type Reader } from '../../protocol/reader.ts';
import { Writer } from '../../protocol/writer.ts';
export interface AlterConfigsRequestConfig {
    name: string;
    value?: NullableString;
}
export interface AlterConfigsRequestResource {
    resourceType: number;
    resourceName: string;
    configs: AlterConfigsRequestConfig[];
}
export type AlterConfigsRequest = Parameters<typeof createRequest>;
export interface AlterConfigsResponseResult {
    errorCode: number;
    errorMessage: NullableString;
    resourceType: number;
    resourceName: string;
}
export interface AlterConfigsResponse {
    throttleTimeMs: number;
    responses: AlterConfigsResponseResult[];
}
export declare function createRequest(resources: AlterConfigsRequestResource[], validateOnly: boolean): Writer;
export declare function parseResponse(_correlationId: number, apiKey: number, apiVersion: number, reader: Reader): AlterConfigsResponse;
export declare const api: import("../definitions.ts").API<[resources: AlterConfigsRequestResource[], validateOnly: boolean], AlterConfigsResponse>;
