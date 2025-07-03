import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  FindCoordinator Request (Version: 4) => key_type [coordinator_keys] TAG_BUFFER
    key_type => INT8
    coordinator_keys => COMPACT_STRING
*/
export function createRequest(keyType, coordinatorKeys) {
    return Writer.create()
        .appendInt8(keyType)
        .appendArray(coordinatorKeys, (w, k) => w.appendString(k), true, false)
        .appendTaggedFields();
}
/*
  FindCoordinator Response (Version: 4) => throttle_time_ms [coordinators] TAG_BUFFER
    throttle_time_ms => INT32
    coordinators => key node_id host port error_code error_message TAG_BUFFER
      key => COMPACT_STRING
      node_id => INT32
      host => COMPACT_STRING
      port => INT32
      error_code => INT16
      error_message => COMPACT_NULLABLE_STRING
*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const errors = [];
    const response = {
        throttleTimeMs: reader.readInt32(),
        coordinators: reader.readArray((r, i) => {
            const coordinator = {
                key: r.readString(),
                nodeId: r.readInt32(),
                host: r.readString(),
                port: r.readInt32(),
                errorCode: r.readInt16(),
                errorMessage: r.readNullableString()
            };
            if (coordinator.errorCode !== 0) {
                errors.push([`/coordinators/${i}`, coordinator.errorCode]);
            }
            return coordinator;
        })
    };
    if (errors.length) {
        throw new ResponseError(apiKey, apiVersion, Object.fromEntries(errors), response);
    }
    return response;
}
export const api = createAPI(10, 4, createRequest, parseResponse);
