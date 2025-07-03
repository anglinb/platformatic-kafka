import { type Reader } from '../../protocol/reader.ts';
import { Writer } from '../../protocol/writer.ts';
export type ListClientMetricsResourcesRequest = Parameters<typeof createRequest>;
export interface ListClientMetricsResourcesResource {
    name: string;
}
export interface ListClientMetricsResourcesResponse {
    throttleTimeMs: number;
    errorCode: number;
    clientMetricsResources: ListClientMetricsResourcesResource[];
}
export declare function createRequest(): Writer;
export declare function parseResponse(_correlationId: number, apiKey: number, apiVersion: number, reader: Reader): ListClientMetricsResourcesResponse;
export declare const api: import("../definitions.ts").API<[], ListClientMetricsResourcesResponse>;
