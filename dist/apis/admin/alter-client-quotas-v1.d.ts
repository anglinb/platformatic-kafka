import { type NullableString } from '../../protocol/definitions.ts';
import { type Reader } from '../../protocol/reader.ts';
import { Writer } from '../../protocol/writer.ts';
export interface AlterClientQuotasRequestEntity {
    entityType: string;
    entityName: NullableString;
}
export interface AlterClientQuotasRequestOp {
    key: string;
    value: number;
    remove: boolean;
}
export interface AlterClientQuotasRequestEntry {
    entities: AlterClientQuotasRequestEntity[];
    ops: AlterClientQuotasRequestOp[];
}
export type AlterClientQuotasRequest = Parameters<typeof createRequest>;
export interface AlterClientQuotasResponseEntity {
    entityType: string;
    entityName: NullableString;
}
export interface AlterClientQuotasResponseEntries {
    errorCode: number;
    errorMessage: NullableString;
    entity: AlterClientQuotasResponseEntity[];
}
export interface AlterClientQuotasResponse {
    throttleTimeMs: number;
    entries: AlterClientQuotasResponseEntries[];
}
export declare function createRequest(entries: AlterClientQuotasRequestEntry[], validateOnly: boolean): Writer;
export declare function parseResponse(_correlationId: number, apiKey: number, apiVersion: number, reader: Reader): AlterClientQuotasResponse;
export declare const api: import("../definitions.ts").API<[entries: AlterClientQuotasRequestEntry[], validateOnly: boolean], AlterClientQuotasResponse>;
