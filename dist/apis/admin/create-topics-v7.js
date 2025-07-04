import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  CreateTopics Request (Version: 7) => [topics] timeout_ms validate_only TAG_BUFFER
    topics => name num_partitions replication_factor [assignments] [configs] TAG_BUFFER
      name => COMPACT_STRING
      num_partitions => INT32
      replication_factor => INT16
      assignments => partition_index [broker_ids] TAG_BUFFER
        partition_index => INT32
        broker_ids => INT32
      configs => name value TAG_BUFFER
        name => COMPACT_STRING
        value => COMPACT_NULLABLE_STRING
    timeout_ms => INT32
    validate_only => BOOLEAN
*/
export function createRequest(topics, timeoutMs, validateOnly) {
    return Writer.create()
        .appendArray(topics, (w, topic) => {
        w.appendString(topic.name)
            .appendInt32(topic.numPartitions)
            .appendInt16(topic.replicationFactor)
            .appendArray(topic.assignments, (w, assignment) => {
            w.appendInt32(assignment.partitionIndex).appendArray(assignment.brokerIds, (w, b) => w.appendInt32(b), true, false);
        })
            .appendArray(topic.configs, (w, config) => {
            w.appendString(config.name).appendString(config.value);
        });
    })
        .appendInt32(timeoutMs)
        .appendBoolean(validateOnly)
        .appendTaggedFields();
}
/*
  CreateTopics Response (Version: 7) => throttle_time_ms [topics] TAG_BUFFER
    throttle_time_ms => INT32
    topics => name topic_id error_code error_message num_partitions replication_factor [configs] TAG_BUFFER
      name => COMPACT_STRING
      topic_id => UUID
      error_code => INT16
      error_message => COMPACT_NULLABLE_STRING
      num_partitions => INT32
      replication_factor => INT16
      configs => name value read_only config_source is_sensitive TAG_BUFFER
        name => COMPACT_STRING
        value => COMPACT_NULLABLE_STRING
        read_only => BOOLEAN
        config_source => INT8
        is_sensitive => BOOLEAN
*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const errors = [];
    const response = {
        throttleTimeMs: reader.readInt32(),
        topics: reader.readArray((r, i) => {
            const topic = {
                name: r.readString(),
                topicId: r.readUUID(),
                errorCode: r.readInt16(),
                errorMessage: r.readNullableString(),
                numPartitions: r.readInt32(),
                replicationFactor: r.readInt16(),
                configs: r.readArray(r => {
                    return {
                        name: r.readString(),
                        value: r.readNullableString(),
                        readOnly: r.readBoolean(),
                        configSource: r.readInt8(),
                        isSensitive: r.readBoolean()
                    };
                })
            };
            if (topic.errorCode !== 0) {
                errors.push([`/topics/${i}`, topic.errorCode]);
            }
            return topic;
        })
    };
    if (errors.length) {
        throw new ResponseError(apiKey, apiVersion, Object.fromEntries(errors), response);
    }
    return response;
}
export const api = createAPI(19, 7, createRequest, parseResponse);
