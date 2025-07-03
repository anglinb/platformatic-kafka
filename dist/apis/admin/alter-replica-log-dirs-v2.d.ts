import { type Reader } from '../../protocol/reader.ts';
import { Writer } from '../../protocol/writer.ts';
export interface AlterReplicaLogDirsRequestTopic {
    name: string;
    partitions: number[];
}
export interface AlterReplicaLogDirsRequestDir {
    path: string;
    topics: AlterReplicaLogDirsRequestTopic[];
}
export type AlterReplicaLogDirsRequest = Parameters<typeof createRequest>;
export interface AlterReplicaLogDirsResponsePartition {
    partitionIndex: number;
    errorCode: number;
}
export interface AlterReplicaLogDirsResponseResult {
    topicName: string;
    partitions: AlterReplicaLogDirsResponsePartition[];
}
export interface AlterReplicaLogDirsResponse {
    throttleTimeMs?: number;
    results: AlterReplicaLogDirsResponseResult[];
}
export declare function createRequest(dirs: AlterReplicaLogDirsRequestDir[]): Writer;
export declare function parseResponse(_correlationId: number, apiKey: number, apiVersion: number, reader: Reader): AlterReplicaLogDirsResponse;
export declare const api: import("../definitions.ts").API<[dirs: AlterReplicaLogDirsRequestDir[]], AlterReplicaLogDirsResponse>;
