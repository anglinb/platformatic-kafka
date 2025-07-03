import { pascalCase } from 'scule';
import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  ListGroups Request (Version: 4) => [states_filter] TAG_BUFFER
    states_filter => COMPACT_STRING
*/
export function createRequest(statesFilter) {
    return Writer.create()
        .appendArray(statesFilter, (w, s) => w.appendString(pascalCase(s, { normalize: true })), true, false)
        .appendTaggedFields();
}
/*
  ListGroups Response (Version: 4) => throttle_time_ms error_code [groups] TAG_BUFFER
    throttle_time_ms => INT32
    error_code => INT16
    groups => group_id protocol_type group_state group_type TAG_BUFFER
      group_id => COMPACT_STRING
      protocol_type => COMPACT_STRING
      group_state => COMPACT_STRING
*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const response = {
        throttleTimeMs: reader.readInt32(),
        errorCode: reader.readInt16(),
        groups: reader.readArray(r => {
            return {
                groupId: r.readNullableString(),
                protocolType: r.readString(),
                groupState: r.readString()
            };
        })
    };
    if (response.errorCode !== 0) {
        throw new ResponseError(apiKey, apiVersion, { '': response.errorCode }, response);
    }
    return response;
}
export const api = createAPI(16, 4, createRequest, parseResponse);
