import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  DescribeUserScramCredentials Request (Version: 0) => [users] TAG_BUFFER
    users => name TAG_BUFFER
      name => COMPACT_STRING
*/
export function createRequest(users) {
    return Writer.create()
        .appendArray(users, (w, u) => w.appendString(u.name))
        .appendTaggedFields();
}
/*
  DescribeUserScramCredentials Response (Version: 0) => throttle_time_ms error_code error_message [results] TAG_BUFFER
    throttle_time_ms => INT32
    error_code => INT16
    error_message => COMPACT_NULLABLE_STRING
    results => user error_code error_message [credential_infos] TAG_BUFFER
      user => COMPACT_STRING
      error_code => INT16
      error_message => COMPACT_NULLABLE_STRING
      credential_infos => mechanism iterations TAG_BUFFER
        mechanism => INT8
        iterations => INT32
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
        errorMessage: reader.readNullableString(),
        results: reader.readArray((r, i) => {
            const user = r.readString();
            const errorCode = r.readInt16();
            if (errorCode !== 0) {
                errors.push([`/results/${i}`, errorCode]);
            }
            return {
                user,
                errorCode,
                errorMessage: r.readNullableString(),
                credentialInfos: r.readArray(r => {
                    return {
                        mechanism: r.readInt8(),
                        iterations: r.readInt32()
                    };
                })
            };
        })
    };
    if (errors.length) {
        throw new ResponseError(apiKey, apiVersion, Object.fromEntries(errors), response);
    }
    return response;
}
export const api = createAPI(50, 0, createRequest, parseResponse);
