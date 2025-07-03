import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  OffsetDelete Request (Version: 0) => group_id [topics]
    group_id => STRING
    topics => name [partitions]
      name => STRING
      partitions => partition_index
        partition_index => INT32
*/
export function createRequest(groupId, topics) {
    return Writer.create()
        .appendString(groupId, false)
        .appendArray(topics, (w, t) => {
        w.appendString(t.name, false).appendArray(t.partitions, (w, p) => w.appendInt32(p.partitionIndex), false, false);
    }, false, false);
}
/*
  OffsetDelete Response (Version: 0) => error_code throttle_time_ms [topics]
    error_code => INT16
    throttle_time_ms => INT32
    topics => name [partitions]
      name => STRING
      partitions => partition_index error_code
        partition_index => INT32
        error_code => INT16
*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const errors = [];
    const errorCode = reader.readInt16();
    if (errorCode !== 0) {
        errors.push(['', errorCode]);
    }
    const response = {
        errorCode,
        throttleTimeMs: reader.readInt32(),
        topics: reader.readArray((r, i) => {
            return {
                name: r.readString(),
                partitions: r.readArray((r, j) => {
                    const partition = {
                        partitionIndex: r.readInt32(),
                        errorCode: r.readInt16()
                    };
                    if (partition.errorCode !== 0) {
                        errors.push([`/topics/${i}/partitions/${j}`, partition.errorCode]);
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
export const api = createAPI(47, 0, createRequest, parseResponse, false, false);
