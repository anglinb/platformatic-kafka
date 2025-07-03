import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  CreateDelegationToken Request (Version: 3) => owner_principal_type owner_principal_name [renewers] max_lifetime_ms TAG_BUFFER
    owner_principal_type => COMPACT_NULLABLE_STRING
    owner_principal_name => COMPACT_NULLABLE_STRING
    renewers => principal_type principal_name TAG_BUFFER
      principal_type => COMPACT_STRING
      principal_name => COMPACT_STRING
    max_lifetime_ms => INT64
*/
export function createRequest(ownerPrincipalType, ownerPrincipalName, renewers, maxLifetimeMs) {
    return Writer.create()
        .appendString(ownerPrincipalType)
        .appendString(ownerPrincipalName)
        .appendArray(renewers, (w, r) => w.appendString(r.principalType).appendString(r.principalName))
        .appendInt64(maxLifetimeMs)
        .appendTaggedFields();
}
/*
  CreateDelegationToken Response (Version: 3) => error_code principal_type principal_name token_requester_principal_type token_requester_principal_name issue_timestamp_ms expiry_timestamp_ms max_timestamp_ms token_id hmac throttle_time_ms TAG_BUFFER
    error_code => INT16
    principal_type => COMPACT_STRING
    principal_name => COMPACT_STRING
    token_requester_principal_type => COMPACT_STRING
    token_requester_principal_name => COMPACT_STRING
    issue_timestamp_ms => INT64
    expiry_timestamp_ms => INT64
    max_timestamp_ms => INT64
    token_id => COMPACT_STRING
    hmac => COMPACT_BYTES
    throttle_time_ms => INT32
*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const response = {
        errorCode: reader.readInt16(),
        principalType: reader.readString(),
        principalName: reader.readString(),
        tokenRequesterPrincipalType: reader.readString(),
        tokenRequesterPrincipalName: reader.readString(),
        issueTimestampMs: reader.readInt64(),
        expiryTimestampMs: reader.readInt64(),
        maxTimestampMs: reader.readInt64(),
        tokenId: reader.readString(),
        hmac: reader.readBytes(),
        throttleTimeMs: reader.readInt32()
    };
    if (response.errorCode !== 0) {
        throw new ResponseError(apiKey, apiVersion, { '': response.errorCode }, response);
    }
    return response;
}
export const api = createAPI(38, 3, createRequest, parseResponse);
