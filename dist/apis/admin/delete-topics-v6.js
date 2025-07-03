import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  DeleteTopics Request (Version: 6) => [topics] timeout_ms TAG_BUFFER
    topics => name topic_id TAG_BUFFER
      name => COMPACT_NULLABLE_STRING
      topic_id => UUID
    timeout_ms => INT32
*/
export function createRequest(topics, timeoutMs) {
    return Writer.create()
        .appendArray(topics, (w, topic) => {
        w.appendString(topic.name).appendUUID(topic.topicId);
    })
        .appendInt32(timeoutMs)
        .appendTaggedFields();
}
/*
  DeleteTopics Response (Version: 6) => throttle_time_ms [responses] TAG_BUFFER
    throttle_time_ms => INT32
    responses => name topic_id error_code error_message TAG_BUFFER
      name => COMPACT_NULLABLE_STRING
      topic_id => UUID
      error_code => INT16
      error_message => COMPACT_NULLABLE_STRING
*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const errors = [];
    const response = {
        throttleTimeMs: reader.readInt32(),
        responses: reader.readArray((r, i) => {
            const topicResponse = {
                name: r.readNullableString(),
                topicId: r.readUUID(),
                errorCode: r.readInt16(),
                errorMessage: r.readNullableString()
            };
            if (topicResponse.errorCode !== 0) {
                errors.push([`/responses/${i}`, topicResponse.errorCode]);
            }
            return topicResponse;
        })
    };
    if (errors.length) {
        throw new ResponseError(apiKey, apiVersion, Object.fromEntries(errors), response);
    }
    return response;
}
export const api = createAPI(20, 6, createRequest, parseResponse);
