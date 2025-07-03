import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  DescribeGroups Request (Version: 5) => [groups] include_authorized_operations TAG_BUFFER
    groups => COMPACT_STRING
    include_authorized_operations => BOOLEAN
*/
export function createRequest(groups, includeAuthorizedOperations) {
    return Writer.create()
        .appendArray(groups, (w, g) => w.appendString(g), true, false)
        .appendBoolean(includeAuthorizedOperations)
        .appendTaggedFields();
}
/*
DescribeGroups Response (Version: 5) => throttle_time_ms [groups] TAG_BUFFER
  throttle_time_ms => INT32
  groups => error_code group_id group_state protocol_type protocol_data [members] authorized_operations TAG_BUFFER
    error_code => INT16
    group_id => COMPACT_STRING
    group_state => COMPACT_STRING
    protocol_type => COMPACT_STRING
    protocol_data => COMPACT_STRING
    members => member_id group_instance_id client_id client_host member_metadata member_assignment TAG_BUFFER
      member_id => COMPACT_STRING
      group_instance_id => COMPACT_NULLABLE_STRING
      client_id => COMPACT_STRING
      client_host => COMPACT_STRING
      member_metadata => COMPACT_BYTES
      member_assignment => COMPACT_BYTES
    authorized_operations => INT32
*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const errors = [];
    const response = {
        throttleTimeMs: reader.readInt32(),
        groups: reader.readArray((r, i) => {
            const group = {
                errorCode: r.readInt16(),
                groupId: r.readString(),
                groupState: r.readString(),
                protocolType: r.readString(),
                protocolData: r.readString(),
                members: r.readArray(r => {
                    return {
                        memberId: r.readString(),
                        groupInstanceId: r.readNullableString(),
                        clientId: r.readString(),
                        clientHost: r.readString(),
                        memberMetadata: r.readBytes(),
                        memberAssignment: r.readBytes()
                    };
                }),
                authorizedOperations: r.readInt32()
            };
            if (group.errorCode !== 0) {
                errors.push([`/groups/${i}`, group.errorCode]);
            }
            return group;
        })
    };
    if (errors.length) {
        throw new ResponseError(apiKey, apiVersion, Object.fromEntries(errors), response);
    }
    return response;
}
export const api = createAPI(15, 5, createRequest, parseResponse);
