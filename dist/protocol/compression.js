import { createRequire } from 'node:module';
import zlib from 'node:zlib';
import { UnsupportedCompressionError } from "../errors.js";
import { DynamicBuffer } from "./dynamic-buffer.js";
const require = createRequire(import.meta.url);
// @ts-ignore - Added in Node.js 22.15.0
const { zstdCompressSync, zstdDecompressSync, gzipSync, gunzipSync } = zlib;
function ensureBuffer(data) {
    return DynamicBuffer.isDynamicBuffer(data) ? data.slice() : data;
}
let snappyCompressSync;
let snappyDecompressSync;
let lz4CompressSync;
let lz4DecompressSync;
let lz4DecompressFrameSync;
function loadSnappy() {
    try {
        const snappy = require('snappy');
        snappyCompressSync = snappy.compressSync;
        snappyDecompressSync = snappy.uncompressSync;
        /* c8 ignore next 5 - In tests snappy is always available */
    }
    catch (e) {
        throw new UnsupportedCompressionError('Cannot load snappy module, which is an optionalDependency. Please check your local installation.');
    }
}
function loadLZ4() {
    try {
        const lz4 = require('@anglinb/lz4-napi');
        lz4CompressSync = lz4.compressSync;
        lz4DecompressSync = lz4.uncompressSync;
        lz4DecompressFrameSync = lz4.decompressFrameSync;
        /* c8 ignore next 5 - In tests lz4-napi is always available */
    }
    catch (e) {
        console.error('!!! error', e);
        throw new UnsupportedCompressionError('Cannot load lz4-napi module, which is an optionalDependency. Please check your local installation.');
    }
}
export const compressionsAlgorithms = {
    /* c8 ignore next 8 - 'none' is actually never used but this is to please Typescript */
    none: {
        compressSync(data) {
            return ensureBuffer(data);
        },
        decompressSync(data) {
            return ensureBuffer(data);
        },
        bitmask: 0,
        available: true
    },
    gzip: {
        compressSync(data) {
            return gzipSync(ensureBuffer(data));
        },
        decompressSync(data) {
            return gunzipSync(ensureBuffer(data));
        },
        bitmask: 1,
        available: true
    },
    snappy: {
        compressSync(data) {
            /* c8 ignore next 4 - In tests snappy is always available */
            if (!snappyCompressSync) {
                loadSnappy();
            }
            return snappyCompressSync(ensureBuffer(data));
        },
        decompressSync(data) {
            /* c8 ignore next 4 - In tests snappy is always available */
            if (!snappyDecompressSync) {
                loadSnappy();
            }
            return snappyDecompressSync(ensureBuffer(data));
        },
        bitmask: 2,
        available: true
    },
    lz4: {
        compressSync(data) {
            /* c8 ignore next 4 - In tests lz4-napi is always available */
            if (!lz4CompressSync) {
                loadLZ4();
            }
            return lz4CompressSync(ensureBuffer(data));
        },
        decompressSync(data) {
            /* c8 ignore next 4 - In tests lz4-napi is always available */
            if (!lz4DecompressSync) {
                loadLZ4();
            }
            return lz4DecompressFrameSync(ensureBuffer(data));
        },
        bitmask: 3,
        available: true
    },
    zstd: {
        /* c8 ignore next 7 - Tests are only run on Node.js versions that support zstd */
        compressSync(data) {
            if (!zstdCompressSync) {
                throw new UnsupportedCompressionError('zstd is not supported in the current Node.js version');
            }
            return zstdCompressSync(ensureBuffer(data));
        },
        /* c8 ignore next 7 - Tests are only run on Node.js versions that support zstd */
        decompressSync(data) {
            if (!zstdCompressSync) {
                throw new UnsupportedCompressionError('zstd is not supported in the current Node.js version');
            }
            return zstdDecompressSync(ensureBuffer(data));
        },
        bitmask: 4,
        available: typeof zstdCompressSync === 'function'
    }
};
export const compressionsAlgorithmsByBitmask = Object.fromEntries(Object.values(compressionsAlgorithms).map(a => [a.bitmask, a]));
