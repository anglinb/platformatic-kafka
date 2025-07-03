import { type NullableString } from '../../protocol/definitions.ts';
import { type Reader } from '../../protocol/reader.ts';
import { Writer } from '../../protocol/writer.ts';
export interface DescribeUserScramCredentialsRequestUser {
    name: string;
}
export type DescribeUserScramCredentialsRequest = Parameters<typeof createRequest>;
export interface DescribeUserScramCredentialsResponseResultCredentialInfo {
    mechanism: number;
    iterations: number;
}
export interface DescribeUserScramCredentialsResponseResult {
    user: string;
    errorCode: number;
    errorMessage: NullableString;
    credentialInfos: DescribeUserScramCredentialsResponseResultCredentialInfo[];
}
export interface DescribeUserScramCredentialsResponse {
    throttleTimeMs: number;
    errorCode: number;
    errorMessage: NullableString;
    results: DescribeUserScramCredentialsResponseResult[];
}
export declare function createRequest(users: DescribeUserScramCredentialsRequestUser[]): Writer;
export declare function parseResponse(_correlationId: number, apiKey: number, apiVersion: number, reader: Reader): DescribeUserScramCredentialsResponse;
export declare const api: import("../definitions.ts").API<[users: DescribeUserScramCredentialsRequestUser[]], DescribeUserScramCredentialsResponse>;
