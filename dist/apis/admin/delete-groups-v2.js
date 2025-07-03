import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  DeleteGroups Request (Version: 2) => [groups_names] TAG_BUFFER
    groups_names => COMPACT_STRING
*/
export function createRequest(groupsNames) {
    return Writer.create()
        .appendArray(groupsNames, (w, r) => w.appendString(r), true, false)
        .appendTaggedFields();
}
/*
  DeleteGroups Response (Version: 2) => throttle_time_ms [results] TAG_BUFFER
    throttle_time_ms => INT32
    results => group_id error_code TAG_BUFFER
      group_id => COMPACT_STRING
      error_code => INT16
*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const errors = [];
    const response = {
        throttleTimeMs: reader.readInt32(),
        results: reader.readArray((r, i) => {
            const group = {
                groupId: r.readString(),
                errorCode: r.readInt16()
            };
            if (group.errorCode !== 0) {
                errors.push([`/results/${i}`, group.errorCode]);
            }
            return group;
        })
    };
    if (errors.length) {
        throw new ResponseError(apiKey, apiVersion, Object.fromEntries(errors), response);
    }
    return response;
}
export const api = createAPI(42, 2, createRequest, parseResponse);
