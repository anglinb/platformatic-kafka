import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  TxnOffsetCommit Request (Version: 4) => transactional_id group_id producer_id producer_epoch generation_id member_id group_instance_id [topics] TAG_BUFFER
    transactional_id => COMPACT_STRING
    group_id => COMPACT_STRING
    producer_id => INT64
    producer_epoch => INT16
    generation_id => INT32
    member_id => COMPACT_STRING
    group_instance_id => COMPACT_NULLABLE_STRING
    topics => name [partitions] TAG_BUFFER
      name => COMPACT_STRING
      partitions => partition_index committed_offset committed_leader_epoch committed_metadata TAG_BUFFER
        partition_index => INT32
        committed_offset => INT64
        committed_leader_epoch => INT32
        committed_metadata => COMPACT_NULLABLE_STRING
*/
export function createRequest(transactionalId, groupId, producerId, producerEpoch, generationId, memberId, groupInstanceId, topics) {
    return Writer.create()
        .appendString(transactionalId, true)
        .appendString(groupId, true)
        .appendInt64(producerId)
        .appendInt16(producerEpoch)
        .appendInt32(generationId)
        .appendString(memberId, true)
        .appendString(groupInstanceId, true)
        .appendArray(topics, (w, t) => {
        w.appendString(t.name, true).appendArray(t.partitions, (w, p) => {
            w.appendInt32(p.partitionIndex)
                .appendInt64(p.committedOffset)
                .appendInt32(p.committedLeaderEpoch)
                .appendString(p.committedMetadata, true);
        });
    })
        .appendTaggedFields();
}
/*
  TxnOffsetCommit Response (Version: 4) => throttle_time_ms [topics] TAG_BUFFER
    throttle_time_ms => INT32
    topics => name [partitions] TAG_BUFFER
      name => COMPACT_STRING
      partitions => partition_index error_code TAG_BUFFER
        partition_index => INT32
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
export const api = createAPI(28, 4, createRequest, parseResponse);
