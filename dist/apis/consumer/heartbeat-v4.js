import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  Heartbeat Request (Version: 4) => group_id generation_id member_id group_instance_id TAG_BUFFER
    group_id => COMPACT_STRING
    generation_id => INT32
    member_id => COMPACT_STRING
    group_instance_id => COMPACT_NULLABLE_STRING
*/
export function createRequest(groupId, generationId, memberId, groupInstanceId) {
    return Writer.create()
        .appendString(groupId)
        .appendInt32(generationId)
        .appendString(memberId)
        .appendString(groupInstanceId)
        .appendTaggedFields();
}
/*
  Heartbeat Response (Version: 4) => throttle_time_ms error_code TAG_BUFFER
    throttle_time_ms => INT32
    error_code => INT16
*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const response = {
        throttleTimeMs: reader.readInt32(),
        errorCode: reader.readInt16()
    };
    if (response.errorCode !== 0) {
        throw new ResponseError(apiKey, apiVersion, { '': response.errorCode }, response);
    }
    return response;
}
export const api = createAPI(12, 4, createRequest, parseResponse);
