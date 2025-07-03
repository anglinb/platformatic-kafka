import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  InitProducerId Request (Version: 5) => transactional_id transaction_timeout_ms producer_id producer_epoch TAG_BUFFER
    transactional_id => COMPACT_NULLABLE_STRING
    transaction_timeout_ms => INT32
    producer_id => INT64
    producer_epoch => INT16
*/
export function createRequest(transactionalId, transactionTimeoutMs, producerId, producerEpoch) {
    return Writer.create()
        .appendString(transactionalId, true)
        .appendInt32(transactionTimeoutMs)
        .appendInt64(producerId)
        .appendInt16(producerEpoch)
        .appendTaggedFields();
}
/*
  InitProducerId Response (Version: 5) => throttle_time_ms error_code producer_id producer_epoch TAG_BUFFER
    throttle_time_ms => INT32
    error_code => INT16
    producer_id => INT64
    producer_epoch => INT16
*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const response = {
        throttleTimeMs: reader.readInt32(),
        errorCode: reader.readInt16(),
        producerId: reader.readInt64(),
        producerEpoch: reader.readInt16()
    };
    if (response.errorCode !== 0) {
        throw new ResponseError(apiKey, apiVersion, { '': response.errorCode }, response);
    }
    return response;
}
export const api = createAPI(22, 5, createRequest, parseResponse);
