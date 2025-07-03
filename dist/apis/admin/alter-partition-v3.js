import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  AlterPartition Request (Version: 3) => broker_id broker_epoch [topics] TAG_BUFFER
    broker_id => INT32
    broker_epoch => INT64
    topics => topic_id [partitions] TAG_BUFFER
      topic_id => UUID
      partitions => partition_index leader_epoch [new_isr_with_epochs] leader_recovery_state partition_epoch TAG_BUFFER
        partition_index => INT32
        leader_epoch => INT32
        new_isr_with_epochs => broker_id broker_epoch TAG_BUFFER
          broker_id => INT32
          broker_epoch => INT64
        leader_recovery_state => INT8
        partition_epoch => INT32
*/
export function createRequest(brokerId, brokerEpoch, topic) {
    return Writer.create()
        .appendInt32(brokerId)
        .appendInt64(brokerEpoch)
        .appendArray(topic, (w, t) => {
        w.appendString(t.topicId).appendArray(t.partitions, (w, p) => {
            w.appendInt32(p.partitionIndex)
                .appendInt32(p.leaderEpoch)
                .appendArray(p.newIsrWithEpochs, (w, n) => {
                w.appendInt32(n.brokerId).appendInt64(n.brokerEpoch);
            })
                .appendInt8(p.leaderRecoveryState)
                .appendInt32(p.partitionEpoch);
        });
    })
        .appendTaggedFields();
}
/*
  AlterPartition Response (Version: 3) => throttle_time_ms error_code [topics] TAG_BUFFER
    throttle_time_ms => INT32
    error_code => INT16
    topics => topic_id [partitions] TAG_BUFFER
      topic_id => UUID
      partitions => partition_index error_code leader_id leader_epoch [isr] leader_recovery_state partition_epoch TAG_BUFFER
        partition_index => INT32
        error_code => INT16
        leader_id => INT32
        leader_epoch => INT32
        isr => INT32
        leader_recovery_state => INT8
        partition_epoch => INT32
*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const errors = [];
    const throttleTimeMs = reader.readInt32();
    const errorCode = reader.readInt16();
    if (errorCode !== 0) {
        errors.push(['/', errorCode]);
    }
    const response = {
        throttleTimeMs,
        errorCode,
        topics: reader.readArray((r, i) => {
            return {
                topicId: r.readString(),
                partitions: r.readArray((r, j) => {
                    const partition = {
                        partitionIndex: r.readInt32(),
                        errorCode: r.readInt16(),
                        leaderId: r.readInt32(),
                        leaderEpoch: r.readInt32(),
                        isr: r.readInt32(),
                        leaderRecoveryState: r.readInt8(),
                        partitionEpoch: r.readInt32()
                    };
                    if (partition.errorCode !== 0) {
                        errors.push([`/topics/${i}/partitions/${j}`, partition.errorCode]);
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
export const api = createAPI(56, 3, createRequest, parseResponse);
