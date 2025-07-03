import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  DescribeLogDirs Request (Version: 4) => [topics] TAG_BUFFER
    topics => topic [partitions] TAG_BUFFER
      topic => COMPACT_STRING
      partitions => INT32
*/
export function createRequest(topics) {
    return Writer.create()
        .appendArray(topics, (w, t) => {
        w.appendString(t.name).appendArray(t.partitions, (w, p) => w.appendInt32(p), true, false);
    })
        .appendTaggedFields();
}
/*
  DescribeLogDirs Response (Version: 4) => throttle_time_ms error_code [results] TAG_BUFFER
    throttle_time_ms => INT32
    error_code => INT16
    results => error_code log_dir [topics] total_bytes usable_bytes TAG_BUFFER
      error_code => INT16
      log_dir => COMPACT_STRING
      topics => name [partitions] TAG_BUFFER
        name => COMPACT_STRING
        partitions => partition_index partition_size offset_lag is_future_key TAG_BUFFER
          partition_index => INT32
          partition_size => INT64
          offset_lag => INT64
          is_future_key => BOOLEAN
      total_bytes => INT64
      usable_bytes => INT64
*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const errors = [];
    const throttleTimeMs = reader.readInt32();
    const errorCode = reader.readInt16();
    if (errorCode !== 0) {
        errors.push(['', errorCode]);
    }
    const response = {
        throttleTimeMs,
        errorCode,
        results: reader.readArray((r, i) => {
            const errorCode = r.readInt16();
            if (errorCode !== 0) {
                errors.push([`/results/${i}`, errorCode]);
            }
            return {
                errorCode,
                logDir: r.readString(),
                topics: r.readArray(reader => {
                    return {
                        name: reader.readString(),
                        partitions: reader.readArray(reader => {
                            return {
                                partitionIndex: reader.readInt32(),
                                partitionSize: reader.readInt64(),
                                offsetLag: reader.readInt64(),
                                isFutureKey: reader.readBoolean()
                            };
                        })
                    };
                }),
                totalBytes: r.readInt64(),
                usableBytes: r.readInt64()
            };
        })
    };
    if (errors.length) {
        throw new ResponseError(apiKey, apiVersion, Object.fromEntries(errors), response);
    }
    return response;
}
export const api = createAPI(35, 4, createRequest, parseResponse);
