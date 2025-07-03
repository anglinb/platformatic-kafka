import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  DescribeClientQuotas Request (Version: 1) => [components] strict TAG_BUFFER
    components => entity_type match_type match TAG_BUFFER
      entity_type => COMPACT_STRING
      match_type => INT8
      match => COMPACT_NULLABLE_STRING
    strict => BOOLEAN
*/
export function createRequest(components, strict) {
    return Writer.create()
        .appendArray(components, (w, c) => {
        w.appendString(c.entityType).appendInt8(c.matchType).appendString(c.match);
    })
        .appendBoolean(strict)
        .appendTaggedFields();
}
/*
  DescribeClientQuotas Response (Version: 1) => throttle_time_ms error_code error_message [entries] TAG_BUFFER
    throttle_time_ms => INT32
    error_code => INT16
    error_message => COMPACT_NULLABLE_STRING
    entries => [entity] [values] TAG_BUFFER
      entity => entity_type entity_name TAG_BUFFER
        entity_type => COMPACT_STRING
        entity_name => COMPACT_NULLABLE_STRING
      values => key value TAG_BUFFER
        key => COMPACT_STRING
        value => FLOAT64
*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const response = {
        throttleTimeMs: reader.readInt32(),
        errorCode: reader.readInt16(),
        errorMessage: reader.readNullableString(),
        entries: reader.readArray(r => {
            return {
                entity: r.readArray(r => {
                    return { entityType: r.readString(), entityName: r.readNullableString() };
                }),
                values: r.readArray(r => {
                    return {
                        key: r.readString(),
                        value: r.readFloat64()
                    };
                })
            };
        })
    };
    if (response.errorCode !== 0) {
        throw new ResponseError(apiKey, apiVersion, { '': response.errorCode }, response);
    }
    return response;
}
export const api = createAPI(48, 1, createRequest, parseResponse);
