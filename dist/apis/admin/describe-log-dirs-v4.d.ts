import { type Reader } from '../../protocol/reader.ts';
import { Writer } from '../../protocol/writer.ts';
export interface DescribeLogDirsRequestTopic {
    name: string;
    partitions: number[];
}
export type DescribeLogDirsRequest = Parameters<typeof createRequest>;
export interface DescribeLogDirsResponsePartition {
    partitionIndex: number;
    partitionSize: bigint;
    offsetLag: bigint;
    isFutureKey: boolean;
}
export interface DescribeLogDirsResponseTopic {
    name: string;
    partitions: DescribeLogDirsResponsePartition[];
}
export interface DescribeLogDirsResponseResult {
    errorCode: number;
    logDir: string;
    topics: DescribeLogDirsResponseTopic[];
    totalBytes: bigint;
    usableBytes: bigint;
}
export interface DescribeLogDirsResponse {
    throttleTimeMs: number;
    errorCode: number;
    results: DescribeLogDirsResponseResult[];
}
export declare function createRequest(topics: DescribeLogDirsRequestTopic[]): Writer;
export declare function parseResponse(_correlationId: number, apiKey: number, apiVersion: number, reader: Reader): DescribeLogDirsResponse;
export declare const api: import("../definitions.ts").API<[topics: DescribeLogDirsRequestTopic[]], DescribeLogDirsResponse>;
