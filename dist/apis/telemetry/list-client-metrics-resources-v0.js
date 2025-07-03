import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  ListClientMetricsResources Request (Version: 0) => TAG_BUFFER
*/
export function createRequest() {
    return Writer.create().appendTaggedFields();
}
/*
ListClientMetricsResources Response (Version: 0) => throttle_time_ms error_code [client_metrics_resources] TAG_BUFFER
  throttle_time_ms => INT32
  error_code => INT16
  client_metrics_resources => name TAG_BUFFER
    name => COMPACT_STRING
*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const response = {
        throttleTimeMs: reader.readInt32(),
        errorCode: reader.readInt16(),
        clientMetricsResources: reader.readArray(r => {
            return {
                name: r.readString()
            };
        })
    };
    if (response.errorCode !== 0) {
        throw new ResponseError(apiKey, apiVersion, { '': response.errorCode }, response);
    }
    return response;
}
export const api = createAPI(74, 0, createRequest, parseResponse);
