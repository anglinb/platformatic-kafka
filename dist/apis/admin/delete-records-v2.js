import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  DeleteRecords Request (Version: 2) => [topics] timeout_ms TAG_BUFFER
    topics => name [partitions] TAG_BUFFER
      name => COMPACT_STRING
      partitions => partition_index offset TAG_BUFFER
        partition_index => INT32
        offset => INT64
    timeout_ms => INT32
*/
export function createRequest(topics, timeoutMs) {
    return Writer.create()
        .appendArray(topics, (w, t) => {
        w.appendString(t.name).appendArray(t.partitions, (w, p) => {
            w.appendInt32(p.partitionIndex).appendInt64(p.offset);
        });
    })
        .appendInt32(timeoutMs)
        .appendTaggedFields();
}
/*
  DeleteRecords Response (Version: 2) => throttle_time_ms [topics] TAG_BUFFER
    throttle_time_ms => INT32
    topics => name [partitions] TAG_BUFFER
      name => COMPACT_STRING
      partitions => partition_index low_watermark error_code TAG_BUFFER
        partition_index => INT32
        low_watermark => INT64
        error_code => INT16
*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const errors = [];
    const response = {
        throttleTimeMs: reader.readInt32(),
        topics: reader.readArray((r, i) => {
            return {
                name: r.readString(),
                partitions: r.readArray((r, j) => {
                    const partition = {
                        partitionIndex: r.readInt32(),
                        lowWatermark: r.readInt64(),
                        errorCode: r.readInt16()
                    };
                    if (partition.errorCode !== 0) {
                        errors.push([`topics[${i}].partitions[${j}]`, partition.errorCode]);
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
export const api = createAPI(21, 2, createRequest, parseResponse);
