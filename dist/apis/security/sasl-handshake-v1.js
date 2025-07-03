import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  SaslHandshake Request (Version: 1) => mechanism
    mechanism => STRING
*/
export function createRequest(mechanism) {
    return Writer.create().appendString(mechanism, false);
}
/*
  SaslHandshake Response (Version: 1) => error_code [mechanisms]
    error_code => INT16
    mechanisms => STRING
*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const response = {
        errorCode: reader.readInt16(),
        mechanisms: reader.readArray(r => {
            return r.readString(false);
        }, false, false)
    };
    if (response.errorCode !== 0) {
        throw new ResponseError(apiKey, apiVersion, { '': response.errorCode }, response);
    }
    return response;
}
export const api = createAPI(17, 1, createRequest, parseResponse, false, false);
