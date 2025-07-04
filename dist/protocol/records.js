import { UnsupportedCompressionError } from "../errors.js";
import { compressionsAlgorithms, compressionsAlgorithmsByBitmask } from "./compression.js";
import { crc32c } from "./crc32c.js";
import { DynamicBuffer } from "./dynamic-buffer.js";
import { Reader } from "./reader.js";
import { Writer } from "./writer.js";
const CURRENT_RECORD_VERSION = 2;
const IS_TRANSACTIONAL = 0b10000; // Bit 4 set
const IS_COMPRESSED = 0b111; // Bits 0, 1 and/or 2 set
export const messageSchema = {
    type: 'object',
    properties: {
        key: {
            oneOf: [{ type: 'string' }, { buffer: true }]
        },
        value: {
            oneOf: [{ type: 'string' }, { buffer: true }]
        },
        headers: {
            // Note: we can't use oneOf here since a Map is also a 'object'. Thanks JS.
            anyOf: [
                {
                    map: true
                },
                {
                    type: 'object',
                    additionalProperties: true
                }
            ]
        },
        topic: { type: 'string' },
        partition: { type: 'integer' },
        timestamp: { bigint: true }
    },
    required: ['value', 'topic'],
    additionalProperties: true
};
export function createRecord(message, offsetDelta, firstTimestamp) {
    return Writer.create()
        .appendInt8(0) // Attributes are unused for now
        .appendVarInt64((message.timestamp ?? BigInt(Date.now())) - firstTimestamp)
        .appendVarInt(offsetDelta)
        .appendVarIntBytes(message.key)
        .appendVarIntBytes(message.value)
        .appendVarIntMap(message.headers, (w, [key, value]) => {
        w.appendVarIntBytes(key).appendVarIntBytes(value);
    })
        .prependVarIntLength();
}
export function readRecord(reader) {
    return {
        length: reader.readVarInt(),
        attributes: reader.readInt8(),
        timestampDelta: reader.readVarInt64(),
        offsetDelta: reader.readVarInt(),
        key: reader.readVarIntBytes(),
        value: reader.readVarIntBytes(),
        headers: reader.readVarIntArray(r => [r.readVarIntBytes(), r.readVarIntBytes()])
    };
}
export function createRecordsBatch(messages, options = {}) {
    const now = BigInt(Date.now());
    const timestamps = [];
    for (let i = 0; i < messages.length; i++) {
        timestamps.push(messages[i].timestamp ?? now);
    }
    messages.sort();
    const firstTimestamp = timestamps[0];
    const maxTimestamp = timestamps[timestamps.length - 1];
    let buffer = new DynamicBuffer();
    for (let i = 0; i < messages.length; i++) {
        const record = createRecord(messages[i], i, firstTimestamp);
        buffer.appendFrom(record.dynamicBuffer);
    }
    let attributes = 0;
    let firstSequence = 0;
    if (options.sequences) {
        const firstMessage = messages[0];
        firstSequence = options.sequences.getWithDefault(`${firstMessage.topic}:${firstMessage.partition}`, 0);
    }
    // Set the transaction
    if (options.transactionalId) {
        attributes |= IS_TRANSACTIONAL;
    }
    // Set the compression, if any
    if ((options.compression ?? 'none') !== 'none') {
        const algorithm = compressionsAlgorithms[options.compression];
        if (!algorithm) {
            throw new UnsupportedCompressionError(`Unsupported compression algorithm ${options.compression}`);
        }
        attributes |= algorithm.bitmask;
        const compressed = algorithm.compressSync(buffer.buffer);
        buffer = new DynamicBuffer(compressed);
    }
    const writer = Writer.create()
        // Phase 1: Prepare the message from Attributes (included) to the end
        .appendInt16(attributes)
        // LastOffsetDelta, FirstTimestamp and MaxTimestamp are extracted from the messages
        .appendInt32(messages.length - 1)
        .appendInt64(BigInt(firstTimestamp))
        .appendInt64(BigInt(maxTimestamp))
        .appendInt64(options.producerId ?? -1n)
        .appendInt16(options.producerEpoch ?? 0)
        .appendInt32(firstSequence)
        .appendInt32(messages.length) // Number of records
        .appendFrom(buffer);
    // Phase 2: Prepend the PartitionLeaderEpoch, Magic and CRC, then the Length and firstOffset, in reverse order
    return (writer
        .appendUnsignedInt32(crc32c(writer.dynamicBuffer), false)
        .appendInt8(CURRENT_RECORD_VERSION, false)
        .appendInt32(options.partitionLeaderEpoch ?? 0, false)
        .prependLength()
        // FirstOffset is 0
        .appendInt64(0n, false));
}
export function readRecordsBatch(reader) {
    const batch = {
        firstOffset: reader.readInt64(),
        length: reader.readInt32(),
        partitionLeaderEpoch: reader.readInt32(),
        magic: reader.readInt8(),
        crc: reader.readUnsignedInt32(),
        attributes: reader.readInt16(),
        lastOffsetDelta: reader.readInt32(),
        firstTimestamp: reader.readInt64(),
        maxTimestamp: reader.readInt64(),
        producerId: reader.readInt64(),
        producerEpoch: reader.readInt16(),
        firstSequence: reader.readInt32(),
        records: []
    };
    const recordsLength = reader.readInt32();
    const compression = batch.attributes & IS_COMPRESSED;
    if (compression !== 0) {
        const algorithm = compressionsAlgorithmsByBitmask[compression];
        if (!algorithm) {
            throw new UnsupportedCompressionError(`Unsupported compression algorithm with bitmask ${compression}`);
        }
        const buffer = algorithm.decompressSync(reader.buffer.slice(reader.position, reader.buffer.length));
        reader = Reader.from(buffer);
    }
    for (let i = 0; i < recordsLength; i++) {
        batch.records.push(readRecord(reader));
    }
    return batch;
}
