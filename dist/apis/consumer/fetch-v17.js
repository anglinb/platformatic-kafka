import { ResponseError } from "../../errors.js";
import { Reader } from "../../protocol/reader.js";
import { readRecordsBatch } from "../../protocol/records.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  Fetch Request (Version: 17) => max_wait_ms min_bytes max_bytes isolation_level session_id session_epoch [topics] [forgotten_topics_data] rack_id TAG_BUFFER
  max_wait_ms => INT32
  min_bytes => INT32
  max_bytes => INT32
  isolation_level => INT8
  session_id => INT32
  session_epoch => INT32
  topics => topic_id [partitions] TAG_BUFFER
    topic_id => UUID
    partitions => partition current_leader_epoch fetch_offset last_fetched_epoch log_start_offset partition_max_bytes TAG_BUFFER
      partition => INT32
      current_leader_epoch => INT32
      fetch_offset => INT64
      last_fetched_epoch => INT32
      log_start_offset => INT64
      partition_max_bytes => INT32
  forgotten_topics_data => topic_id [partitions] TAG_BUFFER
    topic_id => UUID
    partitions => INT32
  rack_id => COMPACT_STRING
*/
export function createRequest(maxWaitMs, minBytes, maxBytes, isolationLevel, sessionId, sessionEpoch, topics, forgottenTopicsData, rackId) {
    return Writer.create()
        .appendInt32(maxWaitMs)
        .appendInt32(minBytes)
        .appendInt32(maxBytes)
        .appendInt8(isolationLevel)
        .appendInt32(sessionId)
        .appendInt32(sessionEpoch)
        .appendArray(topics, (w, t) => {
        w.appendUUID(t.topicId).appendArray(t.partitions, (w, p) => {
            w.appendInt32(p.partition)
                .appendInt32(p.currentLeaderEpoch)
                .appendInt64(p.fetchOffset)
                .appendInt32(p.lastFetchedEpoch)
                .appendInt64(-1n)
                .appendInt32(p.partitionMaxBytes);
        });
    })
        .appendArray(forgottenTopicsData, (w, t) => {
        w.appendUUID(t.topic).appendArray(t.partitions, (w, p) => {
            w.appendInt32(p);
        }, true, false);
    })
        .appendString(rackId)
        .appendTaggedFields();
}
/*
  Fetch Response (Version: 17) => throttle_time_ms error_code session_id [responses] TAG_BUFFER
    throttle_time_ms => INT32
    error_code => INT16
    session_id => INT32
    responses => topic_id [partitions] TAG_BUFFER
      topic_id => UUID
      partitions => partition_index error_code high_watermark last_stable_offset log_start_offset [aborted_transactions] preferred_read_replica records TAG_BUFFER
        partition_index => INT32
        error_code => INT16
        high_watermark => INT64
        last_stable_offset => INT64
        log_start_offset => INT64
        aborted_transactions => producer_id first_offset TAG_BUFFER
          producer_id => INT64
          first_offset => INT64
        preferred_read_replica => INT32
        records => COMPACT_RECORDS
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
        sessionId: reader.readInt32(),
        responses: reader.readArray((r, i) => {
            return {
                topicId: r.readUUID(),
                partitions: r.readArray((r, j) => {
                    const partition = {
                        partitionIndex: r.readInt32(),
                        errorCode: r.readInt16(),
                        highWatermark: r.readInt64(),
                        lastStableOffset: r.readInt64(),
                        logStartOffset: r.readInt64(),
                        abortedTransactions: r.readArray(r => {
                            return {
                                producerId: r.readInt64(),
                                firstOffset: r.readInt64()
                            };
                        }),
                        preferredReadReplica: r.readInt32()
                    };
                    let recordsSize = r.readUnsignedVarInt();
                    if (partition.errorCode !== 0) {
                        errors.push([`/responses/${i}/partitions/${j}`, partition.errorCode]);
                    }
                    if (recordsSize > 1) {
                        recordsSize--;
                        partition.records = readRecordsBatch(Reader.from(r.buffer.subarray(r.position, r.position + recordsSize)));
                        r.skip(recordsSize);
                    }
                    return partition;
                })
            };
        })
    };
    if (errors.length) {
        throw new ResponseError(apiKey, apiVersion, Object.fromEntries(errors), response);
    }
    return response;
}
export const api = createAPI(1, 17, createRequest, parseResponse);
