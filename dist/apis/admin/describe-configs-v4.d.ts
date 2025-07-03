import { type NullableString } from '../../protocol/definitions.ts';
import { type Reader } from '../../protocol/reader.ts';
import { Writer } from '../../protocol/writer.ts';
export interface DescribeConfigsRequestResource {
    resourceType: number;
    resourceName: string;
    configurationKeys: string[];
}
export type DescribeConfigsRequest = Parameters<typeof createRequest>;
export interface DescribeConfigsResponseSynonym {
    name: string;
    value: NullableString;
    source: number;
}
export interface DescribeConfigsResponseConfig {
    name: string;
    value: NullableString;
    readOnly: boolean;
    configSource: number;
    isSensitive: boolean;
    synonyms: DescribeConfigsResponseSynonym[];
    configType: number;
    documentation: NullableString;
}
export interface DescribeConfigsResponseResult {
    errorCode: number;
    errorMessage: NullableString;
    resourceType: number;
    resourceName: string;
    configs: DescribeConfigsResponseConfig[];
}
export interface DescribeConfigsResponse {
    throttleTimeMs: number;
    results: DescribeConfigsResponseResult[];
}
export declare function createRequest(resources: DescribeConfigsRequestResource[], includeSynonyms: boolean, includeDocumentation: boolean): Writer;
export declare function parseResponse(_correlationId: number, apiKey: number, apiVersion: number, reader: Reader): DescribeConfigsResponse;
export declare const api: import("../definitions.ts").API<[resources: DescribeConfigsRequestResource[], includeSynonyms: boolean, includeDocumentation: boolean], DescribeConfigsResponse>;
