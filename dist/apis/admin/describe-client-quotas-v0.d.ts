import { type NullableString } from '../../protocol/definitions.ts';
import { type Reader } from '../../protocol/reader.ts';
import { Writer } from '../../protocol/writer.ts';
export interface DescribeClientQuotasRequestComponent {
    entityType: string;
    matchType: number;
    match: string | null;
}
export type DescribeClientQuotasRequest = Parameters<typeof createRequest>;
export interface DescribeClientQuotasResponseValue {
    key: string;
    value: number;
}
export interface DescribeClientQuotasResponseEntity {
    entityType: string;
    entityName: NullableString;
}
export interface DescribeClientQuotasResponseEntry {
    entity: DescribeClientQuotasResponseEntity[];
    values: DescribeClientQuotasResponseValue[];
}
export interface DescribeClientQuotasResponse {
    throttleTimeMs: number;
    errorCode: number;
    errorMessage: NullableString;
    entries: DescribeClientQuotasResponseEntry[];
}
export declare function createRequest(components: DescribeClientQuotasRequestComponent[], strict: boolean): Writer;
export declare function parseResponse(_correlationId: number, apiKey: number, apiVersion: number, reader: Reader): DescribeClientQuotasResponse;
export declare const api: import("../definitions.ts").API<[components: DescribeClientQuotasRequestComponent[], strict: boolean], DescribeClientQuotasResponse>;
