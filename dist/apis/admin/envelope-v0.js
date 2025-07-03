import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
Envelope Request (Version: 0) => request_data request_principal client_host_address TAG_BUFFER
  request_data => COMPACT_BYTES
  request_principal => COMPACT_NULLABLE_BYTES
  client_host_address => COMPACT_BYTES
*/
export function createRequest(requestData, requestPrincipal, clientHostAddress) {
    return Writer.create()
        .appendBytes(requestData)
        .appendBytes(requestPrincipal)
        .appendBytes(clientHostAddress)
        .appendTaggedFields();
}
/*
Envelope Response (Version: 0) => response_data error_code TAG_BUFFER
  response_data => COMPACT_NULLABLE_BYTES
  error_code => INT16
*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const response = {
        responseData: reader.readNullableBytes(),
        errorCode: reader.readInt16()
    };
    if (response.errorCode) {
        throw new ResponseError(apiKey, apiVersion, { '': response.errorCode }, response);
    }
    return response;
}
export const api = createAPI(58, 0, createRequest, parseResponse);
