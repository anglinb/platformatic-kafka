import { type NullableString } from '../../protocol/definitions.ts';
import { type Reader } from '../../protocol/reader.ts';
import { Writer } from '../../protocol/writer.ts';
export interface IncrementalAlterConfigsRequestConfig {
    name: string;
    configOperation: number;
    value?: NullableString;
}
export interface IncrementalAlterConfigsRequestResource {
    resourceType: number;
    resourceName: string;
    configs: IncrementalAlterConfigsRequestConfig[];
}
export type IncrementalAlterConfigsRequest = Parameters<typeof createRequest>;
export interface IncrementalAlterConfigsResponseResult {
    errorCode: number;
    errorMessage: NullableString;
    resourceType: number;
    resourceName: string;
}
export interface IncrementalAlterConfigsResponse {
    throttleTimeMs: number;
    responses: IncrementalAlterConfigsResponseResult[];
}
export declare function createRequest(resources: IncrementalAlterConfigsRequestResource[], validateOnly: boolean): Writer;
export declare function parseResponse(_correlationId: number, apiKey: number, apiVersion: number, reader: Reader): IncrementalAlterConfigsResponse;
export declare const api: import("../definitions.ts").API<[resources: IncrementalAlterConfigsRequestResource[], validateOnly: boolean], IncrementalAlterConfigsResponse>;
