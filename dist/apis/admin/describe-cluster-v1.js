import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  DescribeCluster Request (Version: 1) => include_cluster_authorized_operations endpoint_type TAG_BUFFER
    include_cluster_authorized_operations => BOOLEAN
    endpoint_type => INT8
*/
export function createRequest(includeClusterAuthorizedOperations, endpointType) {
    return Writer.create().appendBoolean(includeClusterAuthorizedOperations).appendInt8(endpointType).appendTaggedFields();
}
/*
  DescribeCluster Response (Version: 1) => throttle_time_ms error_code error_message endpoint_type cluster_id controller_id [brokers] cluster_authorized_operations TAG_BUFFER
    throttle_time_ms => INT32
    error_code => INT16
    error_message => COMPACT_NULLABLE_STRING
    endpoint_type => INT8
    cluster_id => COMPACT_STRING
    controller_id => INT32
    brokers => broker_id host port rack TAG_BUFFER
      broker_id => INT32
      host => COMPACT_STRING
      port => INT32
      rack => COMPACT_NULLABLE_STRING
    cluster_authorized_operations => INT32
*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const response = {
        throttleTimeMs: reader.readInt32(),
        errorCode: reader.readInt16(),
        errorMessage: reader.readNullableString(),
        endpointType: reader.readInt8(),
        clusterId: reader.readString(),
        controllerId: reader.readInt32(),
        brokers: reader.readArray(r => {
            return {
                brokerId: r.readInt32(),
                host: r.readString(),
                port: r.readInt32(),
                rack: r.readNullableString()
            };
        }),
        clusterAuthorizedOperations: reader.readInt32()
    };
    if (response.errorCode !== 0) {
        throw new ResponseError(apiKey, apiVersion, { '': response.errorCode }, response);
    }
    return response;
}
export const api = createAPI(60, 1, createRequest, parseResponse);
