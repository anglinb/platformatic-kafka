import { type Reader } from '../../protocol/reader.ts';
import { Writer } from '../../protocol/writer.ts';
export type PushTelemetryRequest = Parameters<typeof createRequest>;
export interface PushTelemetryResponse {
    throttleTimeMs: number;
    errorCode: number;
}
export declare function createRequest(clientInstanceId: string, subscriptionId: number, terminating: boolean, compressionType: number, metrics: Buffer): Writer;
export declare function parseResponse(_correlationId: number, apiKey: number, apiVersion: number, reader: Reader): PushTelemetryResponse;
export declare const api: import("../definitions.ts").API<[clientInstanceId: string, subscriptionId: number, terminating: boolean, compressionType: number, metrics: Buffer<ArrayBufferLike>], PushTelemetryResponse>;
