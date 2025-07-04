import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  DescribeProducers Request (Version: 0) => [topics] TAG_BUFFER
    topics => name [partition_indexes] TAG_BUFFER
      name => COMPACT_STRING
      partition_indexes => INT32
*/
export function createRequest(topics) {
    return Writer.create()
        .appendArray(topics, (w, t) => {
        w.appendString(t.name).appendArray(t.partitionIndexes, (w, p) => w.appendInt32(p), true, false);
    })
        .appendTaggedFields();
}
/*
  DescribeProducers Response (Version: 0) => throttle_time_ms [topics] TAG_BUFFER
    throttle_time_ms => INT32
    topics => name [partitions] TAG_BUFFER
      name => COMPACT_STRING
      partitions => partition_index error_code error_message [active_producers] TAG_BUFFER
        partition_index => INT32
        error_code => INT16
        error_message => COMPACT_NULLABLE_STRING
        active_producers => producer_id producer_epoch last_sequence last_timestamp coordinator_epoch current_txn_start_offset TAG_BUFFER
          producer_id => INT64
          producer_epoch => INT32
          last_sequence => INT32
          last_timestamp => INT64
          coordinator_epoch => INT32
          current_txn_start_offset => INT64
*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const errors = [];
    const response = {
        throttleTimeMs: reader.readInt32(),
        topics: reader.readArray(r => {
            return {
                name: r.readString(),
                partitions: reader.readArray((r, i) => {
                    const partition = {
                        partitionIndex: r.readInt32(),
                        errorCode: r.readInt16(),
                        errorMessage: r.readNullableString(),
                        activeProducers: r.readArray(r => {
                            return {
                                producerId: r.readInt64(),
                                producerEpoch: r.readInt32(),
                                lastSequence: r.readInt32(),
                                lastTimestamp: r.readInt64(),
                                coordinatorEpoch: r.readInt32(),
                                currentTxnStartOffset: r.readInt64()
                            };
                        })
                    };
                    if (partition.errorCode !== 0) {
                        errors.push([`/partitions/${i}`, partition.errorCode]);
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
export const api = createAPI(61, 0, createRequest, parseResponse);
