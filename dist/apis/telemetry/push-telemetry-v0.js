import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  PushTelemetry Request (Version: 0) => client_instance_id subscription_id terminating compression_type metrics TAG_BUFFER
    client_instance_id => UUID
    subscription_id => INT32
    terminating => BOOLEAN
    compression_type => INT8
    metrics => COMPACT_BYTES
*/
export function createRequest(clientInstanceId, subscriptionId, terminating, compressionType, metrics) {
    return Writer.create()
        .appendUUID(clientInstanceId)
        .appendInt32(subscriptionId)
        .appendBoolean(terminating)
        .appendInt8(compressionType)
        .appendBytes(metrics)
        .appendTaggedFields();
}
/*
  PushTelemetry Response (Version: 0) => throttle_time_ms error_code TAG_BUFFER
    throttle_time_ms => INT32
    error_code => INT16
*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const response = {
        throttleTimeMs: reader.readInt32(),
        errorCode: reader.readInt16()
    };
    if (response.errorCode !== 0) {
        throw new ResponseError(apiKey, apiVersion, { '': response.errorCode }, response);
    }
    return response;
}
export const api = createAPI(72, 0, createRequest, parseResponse);
