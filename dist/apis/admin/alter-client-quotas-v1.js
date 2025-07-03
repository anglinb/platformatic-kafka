import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  AlterClientQuotas Request (Version: 1) => [entries] validate_only TAG_BUFFER
    entries => [entity] [ops] TAG_BUFFER
      entity => entity_type entity_name TAG_BUFFER
        entity_type => COMPACT_STRING
        entity_name => COMPACT_NULLABLE_STRING
      ops => key value remove TAG_BUFFER
        key => COMPACT_STRING
        value => FLOAT64
        remove => BOOLEAN
    validate_only => BOOLEAN
*/
export function createRequest(entries, validateOnly) {
    return Writer.create()
        .appendArray(entries, (w, e) => {
        w.appendArray(e.entities, (w, e) => {
            w.appendString(e.entityType).appendString(e.entityName);
        }).appendArray(e.ops, (w, o) => {
            w.appendString(o.key).appendFloat64(o.value).appendBoolean(o.remove);
        });
    })
        .appendBoolean(validateOnly)
        .appendTaggedFields();
}
/*
  AlterClientQuotas Response (Version: 1) => throttle_time_ms [entries] TAG_BUFFER
    throttle_time_ms => INT32
    entries => error_code error_message [entity] TAG_BUFFER
      error_code => INT16
      error_message => COMPACT_NULLABLE_STRING
      entity => entity_type entity_name TAG_BUFFER
        entity_type => COMPACT_STRING
        entity_name => COMPACT_NULLABLE_STRING
*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const errors = [];
    const response = {
        throttleTimeMs: reader.readInt32(),
        entries: reader.readArray((r, i) => {
            const entry = {
                errorCode: r.readInt16(),
                errorMessage: r.readNullableString(),
                entity: r.readArray(r => {
                    return {
                        entityType: r.readString(),
                        entityName: r.readNullableString()
                    };
                })
            };
            if (entry.errorCode !== 0) {
                errors.push([`/entries/${i}`, entry.errorCode]);
            }
            return entry;
        })
    };
    if (errors.length) {
        throw new ResponseError(apiKey, apiVersion, Object.fromEntries(errors), response);
    }
    return response;
}
export const api = createAPI(49, 1, createRequest, parseResponse);
