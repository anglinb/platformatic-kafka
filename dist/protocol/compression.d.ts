import { DynamicBuffer } from './dynamic-buffer.ts';
export type SyncCompressionPhase = (data: Buffer | DynamicBuffer) => Buffer;
export type CompressionOperation = (data: Buffer) => Buffer;
export interface CompressionAlgorithm {
    compressSync: SyncCompressionPhase;
    decompressSync: SyncCompressionPhase;
    bitmask: number;
    available?: boolean;
}
export declare const compressionsAlgorithms: {
    readonly none: {
        readonly compressSync: (data: Buffer | DynamicBuffer) => Buffer;
        readonly decompressSync: (data: Buffer | DynamicBuffer) => Buffer;
        readonly bitmask: 0;
        readonly available: true;
    };
    readonly gzip: {
        readonly compressSync: (data: Buffer | DynamicBuffer) => Buffer;
        readonly decompressSync: (data: Buffer | DynamicBuffer) => Buffer;
        readonly bitmask: 1;
        readonly available: true;
    };
    readonly snappy: {
        readonly compressSync: (data: Buffer | DynamicBuffer) => Buffer;
        readonly decompressSync: (data: Buffer | DynamicBuffer) => Buffer;
        readonly bitmask: 2;
        readonly available: true;
    };
    readonly lz4: {
        readonly compressSync: (data: Buffer | DynamicBuffer) => Buffer;
        readonly decompressSync: (data: Buffer | DynamicBuffer) => Buffer;
        readonly bitmask: 3;
        readonly available: true;
    };
    readonly zstd: {
        readonly compressSync: (data: Buffer | DynamicBuffer) => Buffer;
        readonly decompressSync: (data: Buffer | DynamicBuffer) => Buffer;
        readonly bitmask: 4;
        readonly available: boolean;
    };
};
export declare const compressionsAlgorithmsByBitmask: {
    [k: string]: {
        readonly compressSync: (data: Buffer | DynamicBuffer) => Buffer;
        readonly decompressSync: (data: Buffer | DynamicBuffer) => Buffer;
        readonly bitmask: 0;
        readonly available: true;
    } | {
        readonly compressSync: (data: Buffer | DynamicBuffer) => Buffer;
        readonly decompressSync: (data: Buffer | DynamicBuffer) => Buffer;
        readonly bitmask: 1;
        readonly available: true;
    } | {
        readonly compressSync: (data: Buffer | DynamicBuffer) => Buffer;
        readonly decompressSync: (data: Buffer | DynamicBuffer) => Buffer;
        readonly bitmask: 2;
        readonly available: true;
    } | {
        readonly compressSync: (data: Buffer | DynamicBuffer) => Buffer;
        readonly decompressSync: (data: Buffer | DynamicBuffer) => Buffer;
        readonly bitmask: 3;
        readonly available: true;
    } | {
        readonly compressSync: (data: Buffer | DynamicBuffer) => Buffer;
        readonly decompressSync: (data: Buffer | DynamicBuffer) => Buffer;
        readonly bitmask: 4;
        readonly available: boolean;
    };
};
export type CompressionAlgorithms = keyof typeof compressionsAlgorithms;
