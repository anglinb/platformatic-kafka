import { ResponseError } from "../../errors.js";
import { EMPTY_BUFFER } from "../../protocol/definitions.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  JoinGroup Request (Version: 9) => group_id session_timeout_ms rebalance_timeout_ms member_id group_instance_id protocol_type [protocols] reason TAG_BUFFER
    group_id => COMPACT_STRING
    session_timeout_ms => INT32
    rebalance_timeout_ms => INT32
    member_id => COMPACT_STRING
    group_instance_id => COMPACT_NULLABLE_STRING
    protocol_type => COMPACT_STRING
    protocols => name metadata TAG_BUFFER
      name => COMPACT_STRING
      metadata => COMPACT_BYTES
    reason => COMPACT_NULLABLE_STRING
*/
export function createRequest(groupId, sessionTimeoutMs, rebalanceTimeoutMs, memberId, groupInstanceId, protocolType, protocols, reason) {
    return Writer.create()
        .appendString(groupId)
        .appendInt32(sessionTimeoutMs)
        .appendInt32(rebalanceTimeoutMs)
        .appendString(memberId)
        .appendString(groupInstanceId)
        .appendString(protocolType)
        .appendArray(protocols, (w, protocol) => {
        w.appendString(protocol.name).appendBytes(protocol.metadata ? protocol.metadata : EMPTY_BUFFER);
    })
        .appendString(reason)
        .appendTaggedFields();
}
/*
JoinGroup Response (Version: 9) => throttle_time_ms error_code generation_id protocol_type protocol_name leader skip_assignment member_id [members] TAG_BUFFER
  throttle_time_ms => INT32
  error_code => INT16
  generation_id => INT32
  protocol_type => COMPACT_NULLABLE_STRING
  protocol_name => COMPACT_NULLABLE_STRING
  leader => COMPACT_STRING
  skip_assignment => BOOLEAN
  member_id => COMPACT_STRING
  members => member_id group_instance_id metadata TAG_BUFFER
    member_id => COMPACT_STRING
    group_instance_id => COMPACT_NULLABLE_STRING
    metadata => COMPACT_BYTES

*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const response = {
        throttleTimeMs: reader.readInt32(),
        errorCode: reader.readInt16(),
        generationId: reader.readInt32(),
        protocolType: reader.readNullableString(),
        protocolName: reader.readNullableString(),
        leader: reader.readString(),
        skipAssignment: reader.readBoolean(),
        memberId: reader.readNullableString(),
        members: reader.readArray(r => {
            return {
                memberId: r.readString(),
                groupInstanceId: r.readNullableString(),
                metadata: r.readNullableBytes()
            };
        })
    };
    if (response.errorCode !== 0) {
        throw new ResponseError(apiKey, apiVersion, { '': response.errorCode }, response);
    }
    return response;
}
export const api = createAPI(11, 9, createRequest, parseResponse);
