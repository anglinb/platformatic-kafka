import { type Reader } from '../../protocol/reader.ts';
import { Writer } from '../../protocol/writer.ts';
export type SaslHandshakeRequest = Parameters<typeof createRequest>;
export interface SaslHandshakeResponse {
    errorCode?: number;
    mechanisms?: string[];
}
export declare function createRequest(mechanism: string): Writer;
export declare function parseResponse(_correlationId: number, apiKey: number, apiVersion: number, reader: Reader): SaslHandshakeResponse;
export declare const api: import("../definitions.ts").API<[mechanism: string], SaslHandshakeResponse>;
