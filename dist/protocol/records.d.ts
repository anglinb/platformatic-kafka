import { type NumericMap } from '../utils.ts';
import { type CompressionAlgorithms } from './compression.ts';
import { type NullableString } from './definitions.ts';
import { Reader } from './reader.ts';
import { Writer } from './writer.ts';
export interface MessageBase<Key = Buffer, Value = Buffer> {
    key?: Key;
    value?: Value;
    topic: string;
    partition?: number;
    timestamp?: bigint;
}
export interface MessageToProduce<Key = Buffer, Value = Buffer, HeaderKey = Buffer, HeaderValue = Buffer> extends MessageBase<Key, Value> {
    headers?: Map<HeaderKey, HeaderValue> | Record<string, HeaderValue>;
}
export interface Message<Key = Buffer, Value = Buffer, HeaderKey = Buffer, HeaderValue = Buffer> extends Required<MessageBase<Key, Value>> {
    headers: Map<HeaderKey, HeaderValue>;
    offset: bigint;
    commit(callback?: (error?: Error) => void): void | Promise<void>;
}
export interface MessageRecord {
    key?: Buffer;
    value: Buffer;
    headers?: Map<Buffer, Buffer>;
    topic: string;
    partition?: number;
    timestamp?: bigint;
}
export interface CreateRecordsBatchOptions {
    transactionalId?: NullableString;
    compression: CompressionAlgorithms;
    firstSequence?: number;
    producerId: bigint;
    producerEpoch: number;
    sequences: NumericMap;
    partitionLeaderEpoch: number;
}
export interface KafkaRecord {
    length: number;
    attributes: number;
    timestampDelta: bigint;
    offsetDelta: number;
    key: Buffer;
    value: Buffer;
    headers: [Buffer, Buffer][];
}
export interface RecordsBatch {
    firstOffset: bigint;
    length: number;
    partitionLeaderEpoch: number;
    magic: number;
    crc: number;
    attributes: number;
    lastOffsetDelta: number;
    firstTimestamp: bigint;
    maxTimestamp: bigint;
    producerId: bigint;
    producerEpoch: number;
    firstSequence: number;
    records: KafkaRecord[];
}
export declare const messageSchema: {
    type: string;
    properties: {
        key: {
            oneOf: ({
                type: string;
                buffer?: undefined;
            } | {
                buffer: boolean;
                type?: undefined;
            })[];
        };
        value: {
            oneOf: ({
                type: string;
                buffer?: undefined;
            } | {
                buffer: boolean;
                type?: undefined;
            })[];
        };
        headers: {
            anyOf: ({
                map: boolean;
                type?: undefined;
                additionalProperties?: undefined;
            } | {
                type: string;
                additionalProperties: boolean;
                map?: undefined;
            })[];
        };
        topic: {
            type: string;
        };
        partition: {
            type: string;
        };
        timestamp: {
            bigint: boolean;
        };
    };
    required: string[];
    additionalProperties: boolean;
};
export declare function createRecord(message: MessageRecord, offsetDelta: number, firstTimestamp: bigint): Writer;
export declare function readRecord(reader: Reader): KafkaRecord;
export declare function createRecordsBatch(messages: MessageRecord[], options?: Partial<CreateRecordsBatchOptions>): Writer;
export declare function readRecordsBatch(reader: Reader): RecordsBatch;
