import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  DescribeDelegationToken Request (Version: 3) => [owners] TAG_BUFFER
    owners => principal_type principal_name TAG_BUFFER
      principal_type => COMPACT_STRING
      principal_name => COMPACT_STRING
*/
export function createRequest(owners) {
    return Writer.create()
        .appendArray(owners, (w, r) => w.appendString(r.principalType).appendString(r.principalName))
        .appendTaggedFields();
}
/*
DescribeDelegationToken Response (Version: 3) => error_code [tokens] throttle_time_ms TAG_BUFFER
  error_code => INT16
  tokens => principal_type principal_name token_requester_principal_type token_requester_principal_name issue_timestamp expiry_timestamp max_timestamp token_id hmac [renewers] TAG_BUFFER
    principal_type => COMPACT_STRING
    principal_name => COMPACT_STRING
    token_requester_principal_type => COMPACT_STRING
    token_requester_principal_name => COMPACT_STRING
    issue_timestamp => INT64
    expiry_timestamp => INT64
    max_timestamp => INT64
    token_id => COMPACT_STRING
    hmac => COMPACT_BYTES
    renewers => principal_type principal_name TAG_BUFFER
      principal_type => COMPACT_STRING
      principal_name => COMPACT_STRING
  throttle_time_ms => INT32
*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const response = {
        errorCode: reader.readInt16(),
        tokens: reader.readArray(r => {
            return {
                principalType: r.readString(),
                principalName: r.readString(),
                tokenRequesterPrincipalType: r.readString(),
                tokenRequesterPrincipalName: r.readString(),
                issueTimestamp: r.readInt64(),
                expiryTimestamp: r.readInt64(),
                maxTimestamp: r.readInt64(),
                tokenId: r.readString(),
                hmac: r.readBytes(),
                renewers: r.readArray(r => {
                    return {
                        principalType: r.readString(),
                        principalName: r.readString()
                    };
                })
            };
        }),
        throttleTimeMs: reader.readInt32()
    };
    if (response.errorCode !== 0) {
        throw new ResponseError(apiKey, apiVersion, { '': response.errorCode }, response);
    }
    return response;
}
export const api = createAPI(41, 3, createRequest, parseResponse);
