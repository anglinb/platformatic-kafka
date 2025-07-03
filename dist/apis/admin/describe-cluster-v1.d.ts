import { type NullableString } from '../../protocol/definitions.ts';
import { type Reader } from '../../protocol/reader.ts';
import { Writer } from '../../protocol/writer.ts';
export type DescribeClusterRequest = Parameters<typeof createRequest>;
export interface DescribeClusterResponseBroker {
    brokerId: number;
    host: string;
    port: number;
    rack: NullableString;
}
export interface DescribeClusterResponse {
    throttleTimeMs: number;
    errorCode: number;
    errorMessage: NullableString;
    endpointType: number;
    clusterId: string;
    controllerId: number;
    brokers: DescribeClusterResponseBroker[];
    clusterAuthorizedOperations: number;
}
export declare function createRequest(includeClusterAuthorizedOperations: boolean, endpointType: number): Writer;
export declare function parseResponse(_correlationId: number, apiKey: number, apiVersion: number, reader: Reader): DescribeClusterResponse;
export declare const api: import("../definitions.ts").API<[includeClusterAuthorizedOperations: boolean, endpointType: number], DescribeClusterResponse>;
