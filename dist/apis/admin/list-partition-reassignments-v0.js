import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  ListPartitionReassignments Request (Version: 0) => timeout_ms [topics] TAG_BUFFER
    timeout_ms => INT32
    topics => name [partition_indexes] TAG_BUFFER
      name => COMPACT_STRING
      partition_indexes => INT32
*/
export function createRequest(timeoutMs, topics) {
    return Writer.create()
        .appendInt32(timeoutMs)
        .appendArray(topics, (w, t) => {
        w.appendString(t.name).appendArray(t.partitionIndexes, (w, p) => w.appendInt32(p), true, false);
    })
        .appendTaggedFields();
}
/*
  ListPartitionReassignments Response (Version: 0) => throttle_time_ms error_code error_message [topics] TAG_BUFFER
    throttle_time_ms => INT32
    error_code => INT16
    error_message => COMPACT_NULLABLE_STRING
    topics => name [partitions] TAG_BUFFER
      name => COMPACT_STRING
      partitions => partition_index [replicas] [adding_replicas] [removing_replicas] TAG_BUFFER
        partition_index => INT32
        replicas => INT32
        adding_replicas => INT32
        removing_replicas => INT32
*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const response = {
        throttleTimeMs: reader.readInt32(),
        errorCode: reader.readInt16(),
        errorMessage: reader.readNullableString(),
        topics: reader.readArray(r => {
            return {
                name: r.readString(),
                partitions: r.readArray(r => {
                    return {
                        partitionIndex: r.readInt32(),
                        replicas: r.readArray(r => r.readInt32(), true, false),
                        addingReplicas: r.readArray(r => r.readInt32(), true, false),
                        removingReplicas: r.readArray(r => r.readInt32(), true, false)
                    };
                })
            };
        })
    };
    if (response.errorCode !== 0) {
        throw new ResponseError(apiKey, apiVersion, { '': response.errorCode }, response);
    }
    return response;
}
export const api = createAPI(46, 0, createRequest, parseResponse);
