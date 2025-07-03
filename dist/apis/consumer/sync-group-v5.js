import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  SyncGroup Request (Version: 5) => group_id generation_id member_id group_instance_id protocol_type protocol_name [assignments] TAG_BUFFER
    group_id => COMPACT_STRING
    generation_id => INT32
    member_id => COMPACT_STRING
    group_instance_id => COMPACT_NULLABLE_STRING
    protocol_type => COMPACT_NULLABLE_STRING
    protocol_name => COMPACT_NULLABLE_STRING
    assignments => member_id assignment TAG_BUFFER
      member_id => COMPACT_STRING
      assignment => COMPACT_BYTES

*/
export function createRequest(groupId, generationId, memberId, groupInstanceId, protocolType, protocolName, assignments) {
    return Writer.create()
        .appendString(groupId)
        .appendInt32(generationId)
        .appendString(memberId)
        .appendString(groupInstanceId)
        .appendString(protocolType)
        .appendString(protocolName)
        .appendArray(assignments, (w, a) => w.appendString(a.memberId).appendBytes(a.assignment))
        .appendTaggedFields();
}
/*
  SyncGroup Response (Version: 5) => throttle_time_ms error_code protocol_type protocol_name assignment TAG_BUFFER
    throttle_time_ms => INT32
    error_code => INT16
    protocol_type => COMPACT_NULLABLE_STRING
    protocol_name => COMPACT_NULLABLE_STRING
    assignment => COMPACT_BYTES
*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const response = {
        throttleTimeMs: reader.readInt32(),
        errorCode: reader.readInt16(),
        protocolType: reader.readNullableString(),
        protocolName: reader.readNullableString(),
        assignment: reader.readBytes()
    };
    if (response.errorCode !== 0) {
        throw new ResponseError(apiKey, apiVersion, { '': response.errorCode }, response);
    }
    return response;
}
export const api = createAPI(14, 5, createRequest, parseResponse);
