import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  AlterReplicaLogDirs Request (Version: 2) => [dirs] TAG_BUFFER
    dirs => path [topics] TAG_BUFFER
      path => COMPACT_STRING
      topics => name [partitions] TAG_BUFFER
        name => COMPACT_STRING
        partitions => INT32
*/
export function createRequest(dirs) {
    return Writer.create()
        .appendArray(dirs, (w, d) => {
        w.appendString(d.path).appendArray(d.topics, (w, t) => {
            w.appendString(t.name).appendArray(t.partitions, (w, p) => w.appendInt32(p), true, false);
        });
    })
        .appendTaggedFields();
}
/*
  AlterReplicaLogDirs Response (Version: 2) => throttle_time_ms [results] TAG_BUFFER
    throttle_time_ms => INT32
    results => topic_name [partitions] TAG_BUFFER
      topic_name => COMPACT_STRING
      partitions => partition_index error_code TAG_BUFFER
        partition_index => INT32
        error_code => INT16
*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const errors = [];
    const response = {
        throttleTimeMs: reader.readInt32(),
        results: reader.readArray((r, i) => {
            return {
                topicName: r.readString(),
                partitions: r.readArray((r, j) => {
                    const partition = {
                        partitionIndex: r.readInt32(),
                        errorCode: r.readInt16()
                    };
                    if (partition.errorCode !== 0) {
                        errors.push([`/results/${i}/partitions/${j}`, partition.errorCode]);
                    }
                    return partition;
                })
            };
        })
    };
    if (errors.length) {
        throw new ResponseError(apiKey, apiVersion, Object.fromEntries(errors), response);
    }
    return response;
}
export const api = createAPI(34, 2, createRequest, parseResponse);
