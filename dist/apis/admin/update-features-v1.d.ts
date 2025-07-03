import { type NullableString } from '../../protocol/definitions.ts';
import { type Reader } from '../../protocol/reader.ts';
import { Writer } from '../../protocol/writer.ts';
export interface UpdateFeaturesRequestFeature {
    feature: string;
    maxVersionLevel: number;
    upgradeType: number;
}
export type UpdateFeaturesRequest = Parameters<typeof createRequest>;
export interface UpdateFeaturesResponseResult {
    feature: string;
    errorCode: number;
    errorMessage: NullableString;
}
export interface UpdateFeaturesResponse {
    throttleTimeMs: number;
    errorCode: number;
    errorMessage: NullableString;
    results: UpdateFeaturesResponseResult[];
}
export declare function createRequest(timeoutMs: number, featureUpdates: UpdateFeaturesRequestFeature[], validateOnly: boolean): Writer;
export declare function parseResponse(_correlationId: number, apiKey: number, apiVersion: number, reader: Reader): UpdateFeaturesResponse;
export declare const api: import("../definitions.ts").API<[timeoutMs: number, featureUpdates: UpdateFeaturesRequestFeature[], validateOnly: boolean], UpdateFeaturesResponse>;
