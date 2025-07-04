import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  ListTransactions Request (Version: 1) => [state_filters] [producer_id_filters] duration_filter TAG_BUFFER
    state_filters => COMPACT_STRING
    producer_id_filters => INT64
    duration_filter => INT64
*/
export function createRequest(stateFilters, producerIdFilters, durationFilter) {
    return Writer.create()
        .appendArray(stateFilters, (w, t) => w.appendString(t), true, false)
        .appendArray(producerIdFilters, (w, p) => w.appendInt64(p), true, false)
        .appendInt64(durationFilter)
        .appendTaggedFields();
}
/*
  ListTransactions Response (Version: 1) => throttle_time_ms error_code [unknown_state_filters] [transaction_states] TAG_BUFFER
    throttle_time_ms => INT32
    error_code => INT16
    unknown_state_filters => COMPACT_STRING
    transaction_states => transactional_id producer_id transaction_state TAG_BUFFER
      transactional_id => COMPACT_STRING
      producer_id => INT64
      transaction_state => COMPACT_STRING
*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const response = {
        throttleTimeMs: reader.readInt32(),
        errorCode: reader.readInt16(),
        unknownStateFilters: reader.readArray(r => r.readString(), true, false),
        transactionStates: reader.readArray(r => {
            return {
                transactionalId: r.readString(),
                producerId: r.readInt64(),
                transactionState: r.readString()
            };
        })
    };
    if (response.errorCode !== 0) {
        throw new ResponseError(apiKey, apiVersion, { '': response.errorCode }, response);
    }
    return response;
}
export const api = createAPI(66, 1, createRequest, parseResponse);
