import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  ExpireDelegationToken Request (Version: 2) => hmac expiry_time_period_ms TAG_BUFFER
    hmac => COMPACT_BYTES
    expiry_time_period_ms => INT64
*/
export function createRequest(hmac, expiryTimePeriodMs) {
    return Writer.create().appendBytes(hmac).appendInt64(expiryTimePeriodMs).appendTaggedFields();
}
/*
  ExpireDelegationToken Response (Version: 2) => error_code expiry_timestamp_ms throttle_time_ms TAG_BUFFER
    error_code => INT16
    expiry_timestamp_ms => INT64
    throttle_time_ms => INT32
*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const response = {
        errorCode: reader.readInt16(),
        expiryTimestampMs: reader.readInt64(),
        throttleTimeMs: reader.readInt32()
    };
    if (response.errorCode !== 0) {
        throw new ResponseError(apiKey, apiVersion, { '': response.errorCode }, response);
    }
    return response;
}
export const api = createAPI(40, 2, createRequest, parseResponse);
