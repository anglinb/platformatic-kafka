import { type NullableString } from '../../protocol/definitions.ts';
import { type Reader } from '../../protocol/reader.ts';
import { Writer } from '../../protocol/writer.ts';
export type InitProducerIdRequest = Parameters<typeof createRequest>;
export interface InitProducerIdResponseCoordinator {
    key: string;
    nodeId: number;
    host: string;
    port: number;
    errorCode: number;
    errorMessage: NullableString;
}
export interface InitProducerIdResponse {
    throttleTimeMs: number;
    errorCode: number;
    producerId: bigint;
    producerEpoch: number;
}
export declare function createRequest(transactionalId: NullableString, transactionTimeoutMs: number, producerId: bigint, producerEpoch: number): Writer;
export declare function parseResponse(_correlationId: number, apiKey: number, apiVersion: number, reader: Reader): InitProducerIdResponse;
export declare const api: import("../definitions.ts").API<[transactionalId: NullableString, transactionTimeoutMs: number, producerId: bigint, producerEpoch: number], InitProducerIdResponse>;
