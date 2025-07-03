import { type Reader } from '../../protocol/reader.ts';
import { Writer } from '../../protocol/writer.ts';
export type ApiVersionsRequest = Parameters<typeof createRequest>;
export interface ApiVersionsResponseApi {
    apiKey: number;
    name: string;
    minVersion: number;
    maxVersion: number;
}
export type ApiVersionsResponse = {
    errorCode: number;
    apiKeys: ApiVersionsResponseApi[];
    throttleTimeMs: number;
};
export declare function createRequest(clientSoftwareName: string, clientSoftwareVersion: string): Writer;
export declare function parseResponse(_correlationId: number, apiKey: number, apiVersion: number, reader: Reader): ApiVersionsResponse;
export declare const api: import("../definitions.ts").API<[clientSoftwareName: string, clientSoftwareVersion: string], ApiVersionsResponse>;
