import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
ConsumerGroupDescribe Request (Version: 0) => [group_ids] include_authorized_operations TAG_BUFFER
  group_ids => COMPACT_STRING
  include_authorized_operations => BOOLEAN
*/
export function createRequest(groupIds, includeAuthorizedOperations) {
    return Writer.create()
        .appendArray(groupIds, (w, r) => w.appendString(r), true, false)
        .appendBoolean(includeAuthorizedOperations)
        .appendTaggedFields();
}
/*
  ConsumerGroupDescribe Response (Version: 0) => throttle_time_ms [groups] TAG_BUFFER
    throttle_time_ms => INT32
    groups => error_code error_message group_id group_state group_epoch assignment_epoch assignor_name [members] authorized_operations TAG_BUFFER
      error_code => INT16
      error_message => COMPACT_NULLABLE_STRING
      group_id => COMPACT_STRING
      group_state => COMPACT_STRING
      group_epoch => INT32
      assignment_epoch => INT32
      assignor_name => COMPACT_STRING
      members => member_id instance_id rack_id member_epoch client_id client_host [subscribed_topic_names] subscribed_topic_regex assignment target_assignment TAG_BUFFER
        member_id => COMPACT_STRING
        instance_id => COMPACT_NULLABLE_STRING
        rack_id => COMPACT_NULLABLE_STRING
        member_epoch => INT32
        client_id => COMPACT_STRING
        client_host => COMPACT_STRING
        subscribed_topic_names => COMPACT_STRING
        subscribed_topic_regex => COMPACT_NULLABLE_STRING
        assignment => [topic_partitions] TAG_BUFFER
          topic_partitions => topic_id topic_name [partitions] TAG_BUFFER
            topic_id => UUID
            topic_name => COMPACT_STRING
            partitions => INT32
        target_assignment => [topic_partitions] TAG_BUFFER
          topic_partitions => topic_id topic_name [partitions] TAG_BUFFER
            topic_id => UUID
            topic_name => COMPACT_STRING
            partitions => INT32
      authorized_operations => INT32
*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const errors = [];
    const response = {
        throttleTimeMs: reader.readInt32(),
        groups: reader.readArray((r, i) => {
            const errorCode = r.readInt16();
            if (errorCode !== 0) {
                errors.push([`/groups/${i}`, errorCode]);
            }
            return {
                errorCode,
                errorMessage: r.readNullableString(),
                groupId: r.readString(),
                groupState: r.readString(),
                groupEpoch: r.readInt32(),
                assignmentEpoch: r.readInt32(),
                assignorName: r.readString(),
                members: r.readArray(r => {
                    return {
                        memberId: r.readString(),
                        instanceId: r.readNullableString(),
                        rackId: r.readNullableString(),
                        memberEpoch: r.readInt32(),
                        clientId: r.readString(),
                        clientHost: r.readString(),
                        subscribedTopicNames: r.readString(),
                        subscribedTopicRegex: r.readNullableString(),
                        assignment: {
                            topicPartitions: r.readArray(r => {
                                return {
                                    topicId: r.readUUID(),
                                    topicName: r.readString(),
                                    partitions: r.readArray(() => r.readInt32(), true, false)
                                };
                            })
                        },
                        targetAssignment: {
                            topicPartitions: r.readArray(r => {
                                return {
                                    topicId: r.readUUID(),
                                    topicName: r.readString(),
                                    partitions: r.readArray(() => r.readInt32(), true, false)
                                };
                            })
                        }
                    };
                }),
                authorizedOperations: r.readInt32()
            };
        })
    };
    if (errors.length) {
        throw new ResponseError(apiKey, apiVersion, Object.fromEntries(errors), response);
    }
    return response;
}
export const api = createAPI(69, 0, createRequest, parseResponse);
