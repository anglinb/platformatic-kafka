import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  AddOffsetsToTxn Request (Version: 4) => transactional_id producer_id producer_epoch group_id TAG_BUFFER
    transactional_id => COMPACT_STRING
    producer_id => INT64
    producer_epoch => INT16
    group_id => COMPACT_STRING
*/
export function createRequest(transactionalId, producerId, producerEpoch, groupId) {
    return Writer.create()
        .appendString(transactionalId, true)
        .appendInt64(producerId)
        .appendInt16(producerEpoch)
        .appendString(groupId, true)
        .appendTaggedFields();
}
/*
  AddOffsetsToTxn Response (Version: 4) => throttle_time_ms error_code TAG_BUFFER
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
export const api = createAPI(25, 4, createRequest, parseResponse);
