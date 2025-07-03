import { type NullableString } from '../../protocol/definitions.ts';
import { type Reader } from '../../protocol/reader.ts';
import { Writer } from '../../protocol/writer.ts';
export type GetTelemetrySubscriptionsRequest = Parameters<typeof createRequest>;
export interface GetTelemetrySubscriptionsResponse {
    throttleTimeMs: number;
    errorCode: number;
    clientInstanceId: string;
    subscriptionId: number;
    acceptedCompressionTypes: number[];
    pushIntervalMs: number;
    telemetryMaxBytes: number;
    deltaTemporality: boolean;
    requestedMetrics: string[];
}
export declare function createRequest(clientInstanceId?: NullableString): Writer;
export declare function parseResponse(_correlationId: number, apiKey: number, apiVersion: number, reader: Reader): GetTelemetrySubscriptionsResponse;
export declare const api: import("../definitions.ts").API<[clientInstanceId?: NullableString], GetTelemetrySubscriptionsResponse>;
