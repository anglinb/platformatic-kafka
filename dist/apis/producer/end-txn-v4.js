import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  EndTxn Request (Version: 4) => transactional_id producer_id producer_epoch committed TAG_BUFFER
    transactional_id => COMPACT_STRING
    producer_id => INT64
    producer_epoch => INT16
    committed => BOOLEAN
*/
export function createRequest(transactionalId, producerId, producerEpoch, committed) {
    return Writer.create()
        .appendString(transactionalId, true)
        .appendInt64(producerId)
        .appendInt16(producerEpoch)
        .appendBoolean(committed)
        .appendTaggedFields();
}
/*
  EndTxn Response (Version: 4) => throttle_time_ms error_code TAG_BUFFER
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
export const api = createAPI(26, 4, createRequest, parseResponse);
