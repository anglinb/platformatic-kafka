import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  LeaveGroup Request (Version: 5) => group_id [members] TAG_BUFFER
    group_id => COMPACT_STRING
    members => member_id group_instance_id reason TAG_BUFFER
      member_id => COMPACT_STRING
      group_instance_id => COMPACT_NULLABLE_STRING
      reason => COMPACT_NULLABLE_STRING
*/
export function createRequest(groupId, members) {
    return Writer.create()
        .appendString(groupId)
        .appendArray(members, (w, m) => {
        w.appendString(m.memberId).appendString(m.groupInstanceId).appendString(m.reason);
    })
        .appendTaggedFields();
}
/*
  LeaveGroup Response (Version: 5) => throttle_time_ms error_code [members] TAG_BUFFER
    throttle_time_ms => INT32
    error_code => INT16
    members => member_id group_instance_id error_code TAG_BUFFER
      member_id => COMPACT_STRING
      group_instance_id => COMPACT_NULLABLE_STRING
      error_code => INT16

*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const errors = [];
    const throttleTimeMs = reader.readInt32();
    const errorCode = reader.readInt16();
    if (errorCode !== 0) {
        errors.push(['', errorCode]);
    }
    const response = {
        throttleTimeMs,
        errorCode,
        members: reader.readArray((r, i) => {
            const member = {
                memberId: r.readNullableString(),
                groupInstanceId: r.readNullableString(),
                errorCode: r.readInt16()
            };
            if (member.errorCode !== 0) {
                errors.push([`/members/${i}`, member.errorCode]);
            }
            return member;
        })
    };
    if (errors.length) {
        throw new ResponseError(apiKey, apiVersion, Object.fromEntries(errors), response);
    }
    return response;
}
export const api = createAPI(13, 5, createRequest, parseResponse);
