import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  GetTelemetrySubscriptions Request (Version: 0) => client_instance_id TAG_BUFFER
    client_instance_id => UUID
*/
export function createRequest(clientInstanceId) {
    return Writer.create().appendUUID(clientInstanceId).appendTaggedFields();
}
/*
  GetTelemetrySubscriptions Response (Version: 0) => throttle_time_ms error_code client_instance_id subscription_id [accepted_compression_types] push_interval_ms telemetry_max_bytes delta_temporality [requested_metrics] TAG_BUFFER
    throttle_time_ms => INT32
    error_code => INT16
    client_instance_id => UUID
    subscription_id => INT32
    accepted_compression_types => INT8
    push_interval_ms => INT32
    telemetry_max_bytes => INT32
    delta_temporality => BOOLEAN
    requested_metrics => COMPACT_STRING
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
        clientInstanceId: reader.readUUID(),
        subscriptionId: reader.readInt32(),
        acceptedCompressionTypes: reader.readArray(r => r.readInt8(), true, false),
        pushIntervalMs: reader.readInt32(),
        telemetryMaxBytes: reader.readInt32(),
        deltaTemporality: reader.readBoolean(),
        requestedMetrics: reader.readArray(r => r.readString(), true, false)
    };
    if (errors.length) {
        throw new ResponseError(apiKey, apiVersion, Object.fromEntries(errors), response);
    }
    return response;
}
export const api = createAPI(71, 0, createRequest, parseResponse);
