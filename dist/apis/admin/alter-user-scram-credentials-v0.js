import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  AlterUserScramCredentials Request (Version: 0) => [deletions] [upsertions] TAG_BUFFER
    deletions => name mechanism TAG_BUFFER
      name => COMPACT_STRING
      mechanism => INT8
    upsertions => name mechanism iterations salt salted_password TAG_BUFFER
      name => COMPACT_STRING
      mechanism => INT8
      iterations => INT32
      salt => COMPACT_BYTES
      salted_password => COMPACT_BYTES
*/
export function createRequest(deletions, upsertions) {
    return Writer.create()
        .appendArray(deletions, (w, d) => {
        w.appendString(d.name).appendInt8(d.mechanism);
    })
        .appendArray(upsertions, (w, u) => {
        w.appendString(u.name)
            .appendInt8(u.mechanism)
            .appendInt32(u.iterations)
            .appendBytes(u.salt)
            .appendBytes(u.saltedPassword);
    })
        .appendTaggedFields()
        .appendTaggedFields();
}
/*
  AlterUserScramCredentials Response (Version: 0) => throttle_time_ms [results] TAG_BUFFER
    throttle_time_ms => INT32
    results => user error_code error_message TAG_BUFFER
      user => COMPACT_STRING
      error_code => INT16
      error_message => COMPACT_NULLABLE_STRING
*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const errors = [];
    const response = {
        throttleTimeMs: reader.readInt32(),
        results: reader.readArray((r, i) => {
            const result = {
                user: r.readString(),
                errorCode: r.readInt16(),
                errorMessage: r.readNullableString()
            };
            if (result.errorCode !== 0) {
                errors.push([`/results/${i}`, result.errorCode]);
            }
            return result;
        })
    };
    if (errors.length) {
        throw new ResponseError(apiKey, apiVersion, Object.fromEntries(errors), response);
    }
    return response;
}
export const api = createAPI(51, 0, createRequest, parseResponse);
