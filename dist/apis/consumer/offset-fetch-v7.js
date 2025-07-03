import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  OffsetFetch Request (Version: 7) => [groups] require_stable
    groups => group_id [topics]
      group_id => STRING
      topics => name [partition_indexes]
        name => STRING
        partition_indexes => INT32
    require_stable => BOOLEAN
*/
export function createRequest(groups, requireStable) {
    return Writer.create()
        .appendArray(groups, (w, g) => {
        w.appendString(g.groupId, false).appendArray(g.topics, (w, t) => {
            w.appendString(t.name, false).appendArray(t.partitionIndexes, (w, i) => w.appendInt32(i), false, false);
        }, false, false);
    }, false, false)
        .appendBoolean(requireStable);
}
/*
  OffsetFetch Response (Version: 7) => throttle_time_ms [groups]
    throttle_time_ms => INT32
    groups => group_id [topics] error_code
      group_id => STRING
      topics => name [partitions]
        name => STRING
        partitions => partition_index committed_offset committed_leader_epoch metadata error_code
          partition_index => INT32
          committed_offset => INT64
          committed_leader_epoch => INT32
          metadata => NULLABLE_STRING
          error_code => INT16
      error_code => INT16
*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const errors = [];
    const response = {
        throttleTimeMs: reader.readInt32(),
        groups: reader.readArray((r, i) => {
            const group = {
                groupId: r.readString(false),
                topics: r.readArray((r, j) => {
                    return {
                        name: r.readString(false),
                        partitions: r.readArray((r, k) => {
                            const partition = {
                                partitionIndex: r.readInt32(),
                                committedOffset: r.readInt64(),
                                committedLeaderEpoch: r.readInt32(),
                                metadata: r.readNullableString(false),
                                errorCode: r.readInt16()
                            };
                            if (partition.errorCode !== 0) {
                                errors.push([`/groups/${i}/topics/${j}/partitions/${k}`, partition.errorCode]);
                            }
                            return partition;
                        }, false, false)
                    };
                }, false, false),
                errorCode: r.readInt16()
            };
            if (group.errorCode !== 0) {
                errors.push([`/groups/${i}`, group.errorCode]);
            }
            return group;
        }, false, false)
    };
    if (errors.length) {
        throw new ResponseError(apiKey, apiVersion, Object.fromEntries(errors), response);
    }
    return response;
}
export const api = createAPI(9, 7, createRequest, parseResponse);
