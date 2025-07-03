import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  ConsumerGroupHeartbeat Request (Version: 0) => group_id member_id member_epoch instance_id rack_id rebalance_timeout_ms [subscribed_topic_names] server_assignor [topic_partitions] TAG_BUFFER
    group_id => COMPACT_STRING
    member_id => COMPACT_STRING
    member_epoch => INT32
    instance_id => COMPACT_NULLABLE_STRING
    rack_id => COMPACT_NULLABLE_STRING
    rebalance_timeout_ms => INT32
    subscribed_topic_names => COMPACT_STRING
    server_assignor => COMPACT_NULLABLE_STRING
    topic_partitions => topic_id [partitions] TAG_BUFFER
      topic_id => UUID
      partitions => INT32
*/
export function createRequest(groupId, memberId, memberEpoch, instanceId, rackId, rebalanceTimeoutMs, subscribedTopicNames, serverAssignor, topicPartitions) {
    return Writer.create()
        .appendString(groupId)
        .appendString(memberId)
        .appendInt32(memberEpoch)
        .appendString(instanceId)
        .appendString(rackId)
        .appendInt32(rebalanceTimeoutMs)
        .appendArray(subscribedTopicNames, (w, t) => w.appendString(t), true, false)
        .appendString(serverAssignor)
        .appendArray(topicPartitions, (w, t) => {
        return w.appendUUID(t.topicId).appendArray(t.partitions, (w, p) => w.appendInt32(p), true, false);
    })
        .appendTaggedFields();
}
/*
  ConsumerGroupHeartbeat Response (Version: 0) => throttle_time_ms error_code error_message member_id member_epoch heartbeat_interval_ms assignment TAG_BUFFER
    throttle_time_ms => INT32
    error_code => INT16
    error_message => COMPACT_NULLABLE_STRING
    member_id => COMPACT_NULLABLE_STRING
    member_epoch => INT32
    heartbeat_interval_ms => INT32
    assignment => [topic_partitions] TAG_BUFFER
      topic_partitions => topic_id [partitions] TAG_BUFFER
        topic_id => UUID
        partitions => INT32
*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const response = {
        throttleTimeMs: reader.readInt32(),
        errorCode: reader.readInt16(),
        errorMessage: reader.readNullableString(),
        memberId: reader.readNullableString(),
        memberEpoch: reader.readInt32(),
        heartbeatIntervalMs: reader.readInt32(),
        assignment: reader.readArray(r => {
            return {
                topicPartitions: r.readArray(r => {
                    return {
                        topicId: r.readUUID(),
                        partitions: r.readArray(r => r.readInt32(), true, false)
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
export const api = createAPI(68, 0, createRequest, parseResponse);
