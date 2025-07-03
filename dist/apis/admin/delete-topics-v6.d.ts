import { type NullableString } from '../../protocol/definitions.ts';
import { type Reader } from '../../protocol/reader.ts';
import { Writer } from '../../protocol/writer.ts';
export interface DeleteTopicsRequestTopic {
    name: string;
    topicId?: NullableString;
}
export type DeleteTopicsRequest = Parameters<typeof createRequest>;
export interface DeleteTopicsResponseResponse {
    name: NullableString;
    topicId: string;
    errorCode: number;
    errorMessage: NullableString;
}
export interface DeleteTopicsResponse {
    throttleTimeMs: number;
    responses: DeleteTopicsResponseResponse[];
}
export declare function createRequest(topics: DeleteTopicsRequestTopic[], timeoutMs: number): Writer;
export declare function parseResponse(_correlationId: number, apiKey: number, apiVersion: number, reader: Reader): DeleteTopicsResponse;
export declare const api: import("../definitions.ts").API<[topics: DeleteTopicsRequestTopic[], timeoutMs: number], DeleteTopicsResponse>;
