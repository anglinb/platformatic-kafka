import { type NullableString } from '../../protocol/definitions.ts';
import { type Reader } from '../../protocol/reader.ts';
import { Writer } from '../../protocol/writer.ts';
export interface CreatePartitionsRequestAssignment {
    brokerIds: number[];
}
export interface CreatePartitionsRequestTopic {
    name: string;
    count: number;
    assignments: CreatePartitionsRequestAssignment[];
}
export type CreatePartitionsRequest = Parameters<typeof createRequest>;
export interface CreatePartitionsResponseResult {
    name: string;
    errorCode: number;
    errorMessage: NullableString;
}
export interface CreatePartitionsResponse {
    throttleTimeMs: number;
    results: CreatePartitionsResponseResult[];
}
export declare function createRequest(topics: CreatePartitionsRequestTopic[], timeoutMs: number, validateOnly: boolean): Writer;
export declare function parseResponse(_correlationId: number, apiKey: number, apiVersion: number, reader: Reader): CreatePartitionsResponse;
export declare const api: import("../definitions.ts").API<[topics: CreatePartitionsRequestTopic[], timeoutMs: number, validateOnly: boolean], CreatePartitionsResponse>;
