import { type Reader } from '../../protocol/reader.ts';
import { Writer } from '../../protocol/writer.ts';
import { type TransactionState } from '../enumerations.ts';
export type ListTransactionsRequest = Parameters<typeof createRequest>;
export interface ListTransactionsResponseTransactionState {
    transactionalId: string;
    producerId: bigint;
    transactionState: string;
}
export interface ListTransactionsResponse {
    throttleTimeMs: number;
    errorCode: number;
    unknownStateFilters: string[];
    transactionStates: ListTransactionsResponseTransactionState[];
}
export declare function createRequest(stateFilters: TransactionState[], producerIdFilters: bigint[], durationFilter: bigint): Writer;
export declare function parseResponse(_correlationId: number, apiKey: number, apiVersion: number, reader: Reader): ListTransactionsResponse;
export declare const api: import("../definitions.ts").API<[stateFilters: ("EMPTY" | "ONGOING" | "PREPARE_ABORT" | "COMMITTING" | "ABORTING" | "COMPLETE_COMMIT" | "COMPLETE_ABORT")[], producerIdFilters: bigint[], durationFilter: bigint], ListTransactionsResponse>;
