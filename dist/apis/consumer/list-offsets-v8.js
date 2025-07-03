import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  ListOffsets Request (Version: 8) => replica_id isolation_level [topics] TAG_BUFFER
    replica_id => INT32
    isolation_level => INT8
    topics => name [partitions] TAG_BUFFER
      name => COMPACT_STRING
      partitions => partition_index current_leader_epoch timestamp TAG_BUFFER
        partition_index => INT32
        current_leader_epoch => INT32
        timestamp => INT64
*/
export function createRequest(replica, isolationLevel, topics) {
    return Writer.create()
        .appendInt32(replica)
        .appendInt8(isolationLevel)
        .appendArray(topics, (w, topic) => {
        w.appendString(topic.name).appendArray(topic.partitions, (w, partition) => {
            w.appendInt32(partition.partitionIndex)
                .appendInt32(partition.currentLeaderEpoch)
                .appendInt64(partition.timestamp);
        });
    })
        .appendTaggedFields();
}
/*
  ListOffsets Response (Version: 8) => throttle_time_ms [topics] TAG_BUFFER
    throttle_time_ms => INT32
    topics => name [partitions] TAG_BUFFER
      name => COMPACT_STRING
      partitions => partition_index error_code timestamp offset leader_epoch TAG_BUFFER
        partition_index => INT32
        error_code => INT16
        timestamp => INT64
        offset => INT64
        leader_epoch => INT32
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
                        errorCode: r.readInt16(),
                        timestamp: r.readInt64(),
                        offset: r.readInt64(),
                        leaderEpoch: r.readInt32()
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
export const api = createAPI(2, 8, createRequest, parseResponse);
