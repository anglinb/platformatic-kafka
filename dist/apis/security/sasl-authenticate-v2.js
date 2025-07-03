import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  SaslAuthenticate Request (Version: 2) => auth_bytes TAG_BUFFER
    auth_bytes => COMPACT_BYTES
*/
export function createRequest(authBytes) {
    return Writer.create().appendBytes(authBytes).appendTaggedFields();
}
/*
  SaslAuthenticate Response (Version: 2) => error_code error_message auth_bytes session_lifetime_ms TAG_BUFFER
    error_code => INT16
    error_message => COMPACT_NULLABLE_STRING
    auth_bytes => COMPACT_BYTES
    session_lifetime_ms => INT64
*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const response = {
        errorCode: reader.readInt16(),
        errorMessage: reader.readNullableString(),
        authBytes: reader.readBytes(),
        sessionLifetimeMs: reader.readInt64()
    };
    if (response.errorCode !== 0) {
        throw new ResponseError(apiKey, apiVersion, { '': response.errorCode }, response);
    }
    return response;
}
export const api = createAPI(36, 2, createRequest, parseResponse);
