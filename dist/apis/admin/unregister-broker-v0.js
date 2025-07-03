import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
UnregisterBroker Request (Version: 0) => broker_id TAG_BUFFER
  broker_id => INT32
*/
export function createRequest(brokerId) {
    return Writer.create().appendInt32(brokerId).appendTaggedFields();
}
/*
  UnregisterBroker Response (Version: 0) => throttle_time_ms error_code error_message TAG_BUFFER
    throttle_time_ms => INT32
    error_code => INT16
    error_message => COMPACT_NULLABLE_STRING
*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const response = {
        throttleTimeMs: reader.readInt32(),
        errorCode: reader.readInt16(),
        errorMessage: reader.readNullableString()
    };
    if (response.errorCode !== 0) {
        throw new ResponseError(apiKey, apiVersion, { '': response.errorCode }, response);
    }
    return response;
}
export const api = createAPI(64, 0, createRequest, parseResponse);
