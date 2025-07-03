import { type Reader } from '../../protocol/reader.ts';
import { Writer } from '../../protocol/writer.ts';
export interface DescribeDelegationTokenRequestOwner {
    principalType: string;
    principalName: string;
}
export type DescribeDelegationTokenRequest = Parameters<typeof createRequest>;
export interface DescribeDelegationTokenResponseRenewer {
    principalType: string;
    principalName: string;
}
export interface DescribeDelegationTokenResponseToken {
    principalType: string;
    principalName: string;
    tokenRequesterPrincipalType: string;
    tokenRequesterPrincipalName: string;
    issueTimestamp: bigint;
    expiryTimestamp: bigint;
    maxTimestamp: bigint;
    tokenId: string;
    hmac: Buffer;
    renewers: DescribeDelegationTokenResponseRenewer[];
}
export interface DescribeDelegationTokenResponse {
    errorCode: number;
    tokens: DescribeDelegationTokenResponseToken[];
    throttleTimeMs: number;
}
export declare function createRequest(owners: DescribeDelegationTokenRequestOwner[]): Writer;
export declare function parseResponse(_correlationId: number, apiKey: number, apiVersion: number, reader: Reader): DescribeDelegationTokenResponse;
export declare const api: import("../definitions.ts").API<[owners: DescribeDelegationTokenRequestOwner[]], DescribeDelegationTokenResponse>;
