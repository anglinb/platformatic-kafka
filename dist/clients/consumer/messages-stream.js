import { Readable } from 'node:stream';
import { createPromisifiedCallback, kCallbackPromise, noopCallback } from "../../apis/callbacks.js";
import { ListOffsetTimestamps } from "../../apis/enumerations.js";
import { consumerReceivesChannel, createDiagnosticContext, notifyCreation } from "../../diagnostic.js";
import { UserError } from "../../errors.js";
import { kInspect, kPrometheus } from "../base/base.js";
import { ensureMetric } from "../metrics.js";
import { defaultConsumerOptions } from "./options.js";
import { MessagesStreamFallbackModes, MessagesStreamModes } from "./types.js";
// Don't move this function as being in the same file will enable V8 to remove.
// For futher info, ask Matteo.
/* c8 ignore next 3 - Fallback deserializer, nothing to really test */
export function noopDeserializer(data) {
    return data;
}
export function defaultCorruptedMessageHandler() {
    return true;
}
export class MessagesStream extends Readable {
    #consumer;
    #mode;
    #fallbackMode;
    #options;
    #topics;
    #offsetsToFetch;
    #offsetsToCommit;
    #inflightNodes;
    #keyDeserializer;
    #valueDeserializer;
    #headerKeyDeserializer;
    #headerValueDeserializer;
    #autocommitEnabled;
    #autocommitInterval;
    #autocommitInflight;
    #shouldClose;
    #closeCallbacks;
    #metricsConsumedMessages;
    #corruptedMessageHandler;
    constructor(consumer, options) {
        const { autocommit, mode, fallbackMode, offsets, deserializers, onCorruptedMessage, ...otherOptions } = options;
        if (offsets && mode !== MessagesStreamModes.MANUAL) {
            throw new UserError('Cannot specify offsets when the stream mode is not MANUAL.');
        }
        if (!offsets && mode === MessagesStreamModes.MANUAL) {
            throw new UserError('Must specify offsets when the stream mode is MANUAL.');
        }
        /* c8 ignore next - Unless is initialized directly, highWaterMark is always defined */
        super({ objectMode: true, highWaterMark: options.highWaterMark ?? defaultConsumerOptions.highWaterMark });
        this.#consumer = consumer;
        this.#mode = mode ?? MessagesStreamModes.LATEST;
        this.#fallbackMode = fallbackMode ?? MessagesStreamFallbackModes.LATEST;
        this.#offsetsToCommit = new Map();
        this.#topics = structuredClone(options.topics);
        this.#inflightNodes = new Set();
        this.#keyDeserializer = deserializers?.key ?? noopDeserializer;
        this.#valueDeserializer = deserializers?.value ?? noopDeserializer;
        this.#headerKeyDeserializer = deserializers?.headerKey ?? noopDeserializer;
        this.#headerValueDeserializer = deserializers?.headerValue ?? noopDeserializer;
        this.#autocommitEnabled = !!options.autocommit;
        this.#autocommitInflight = false;
        this.#shouldClose = false;
        this.#closeCallbacks = [];
        this.#corruptedMessageHandler = onCorruptedMessage ?? defaultCorruptedMessageHandler;
        // Restore offsets
        this.#offsetsToFetch = new Map();
        if (offsets) {
            for (const { topic, partition, offset } of offsets) {
                this.#offsetsToFetch.set(`${topic}:${partition}`, offset);
            }
        }
        // Clone the rest of the options so the user can never mutate them
        this.#options = structuredClone(otherOptions);
        // Start the autocommit interval
        if (typeof autocommit === 'number' && autocommit > 0) {
            this.#autocommitInterval = setInterval(this.#autocommit.bind(this), autocommit);
        }
        else {
            this.#autocommitInterval = null;
        }
        // When the consumer joins a group, we need to fetch again as the assignments
        // will have changed so we may have gone from last  with no assignments to
        // having some.
        this.#consumer.on('consumer:group:join', () => {
            this.#refreshOffsets((error) => {
                /* c8 ignore next 4 - Hard to test */
                if (error) {
                    this.destroy(error);
                    return;
                }
                this.#fetch();
            });
        });
        if (consumer[kPrometheus]) {
            this.#metricsConsumedMessages = ensureMetric(consumer[kPrometheus], 'Counter', 'kafka_consumed_messages', 'Number of consumed Kafka messages');
        }
        notifyCreation('messages-stream', this);
    }
    close(callback) {
        if (!callback) {
            callback = createPromisifiedCallback();
        }
        if (this.closed || this.destroyed) {
            callback(null);
            return callback[kCallbackPromise];
        }
        this.#closeCallbacks.push(callback);
        if (this.#shouldClose) {
            this.#invokeCloseCallbacks(null);
            return callback[kCallbackPromise];
        }
        this.#shouldClose = true;
        this.push(null);
        if (this.#autocommitInterval) {
            clearInterval(this.#autocommitInterval);
        }
        if (this.readableFlowing === null || this.isPaused()) {
            this.removeAllListeners('data');
            this.removeAllListeners('readable');
            this.resume();
        }
        /* c8 ignore next 3 - Hard to test */
        this.once('error', (error) => {
            callback(error);
        });
        this.once('close', () => {
            // We have offsets that were enqueued to be committed. Perform the operation
            if (this.#offsetsToCommit.size > 0) {
                this.#autocommit();
            }
            // We have offsets that are being committed. These are awaited despite of the force parameters
            if (this.#autocommitInflight) {
                this.once('autocommit', error => {
                    this.#invokeCloseCallbacks(error);
                });
                return;
            }
            this.#invokeCloseCallbacks(null);
        });
        return callback[kCallbackPromise];
    }
    /* c8 ignore next 3 - Only forwards to Node.js implementation - Inserted here to please Typescript */
    addListener(event, listener) {
        return super.addListener(event, listener);
    }
    /* c8 ignore next 3 - Only forwards to Node.js implementation - Inserted here to please Typescript */
    on(event, listener) {
        return super.on(event, listener);
    }
    /* c8 ignore next 3 - Only forwards to Node.js implementation - Inserted here to please Typescript */
    once(event, listener) {
        return super.once(event, listener);
    }
    /* c8 ignore next 3 - Only forwards to Node.js implementation - Inserted here to please Typescript */
    prependListener(event, listener) {
        return super.prependListener(event, listener);
    }
    /* c8 ignore next 3 - Only forwards to Node.js implementation - Inserted here to please Typescript */
    prependOnceListener(event, listener) {
        return super.prependOnceListener(event, listener);
    }
    [Symbol.asyncIterator]() {
        return super[Symbol.asyncIterator]();
    }
    _construct(callback) {
        this.#refreshOffsets(callback);
    }
    _destroy(error, callback) {
        if (this.#autocommitInterval) {
            clearInterval(this.#autocommitInterval);
        }
        callback(error);
    }
    _read() {
        this.#fetch();
    }
    #fetch() {
        /* c8 ignore next 4 - Hard to test */
        if (this.#shouldClose || this.closed || this.destroyed) {
            this.push(null);
            return;
        }
        this.#consumer.metadata({ topics: this.#consumer.topics.current }, (error, metadata) => {
            if (error) {
                // The stream has been closed, ignore any error
                /* c8 ignore next 4 - Hard to test */
                if (this.#shouldClose) {
                    this.push(null);
                    return;
                }
                this.destroy(error);
                return;
            }
            /* c8 ignore next 4 - Hard to test */
            if (this.#shouldClose || this.closed || this.destroyed) {
                this.push(null);
                return;
            }
            const requests = new Map();
            const topicIds = new Map();
            // Group topic-partitions by the destination broker
            const requestedOffsets = new Map();
            for (const topic of this.#topics) {
                const assignment = this.#assignmentsForTopic(topic);
                // This consumer has no assignment for the topic, continue
                if (!assignment) {
                    continue;
                }
                const partitions = assignment.partitions;
                for (const partition of partitions) {
                    const leader = metadata.topics.get(topic).partitions[partition].leader;
                    if (this.#inflightNodes.has(leader)) {
                        continue;
                    }
                    let leaderRequests = requests.get(leader);
                    if (!leaderRequests) {
                        leaderRequests = [];
                        requests.set(leader, leaderRequests);
                    }
                    const topicId = metadata.topics.get(topic).id;
                    topicIds.set(topicId, topic);
                    const fetchOffset = this.#offsetsToFetch.get(`${topic}:${partition}`);
                    requestedOffsets.set(`${topic}:${partition}`, fetchOffset);
                    leaderRequests.push({
                        topicId,
                        partitions: [
                            {
                                partition,
                                fetchOffset,
                                partitionMaxBytes: this.#options.maxBytes,
                                currentLeaderEpoch: -1,
                                lastFetchedEpoch: -1
                            }
                        ]
                    });
                }
            }
            for (const [leader, leaderRequests] of requests) {
                this.#inflightNodes.add(leader);
                this.#consumer.fetch({ ...this.#options, node: leader, topics: leaderRequests }, (error, response) => {
                    this.#inflightNodes.delete(leader);
                    if (error) {
                        // The stream has been closed, ignore the error
                        /* c8 ignore next 4 - Hard to test */
                        if (this.#shouldClose) {
                            this.push(null);
                            return;
                        }
                        this.destroy(error);
                        return;
                    }
                    if (this.#shouldClose || this.closed || this.destroyed) {
                        // When it's the last inflight, we finally close the stream.
                        // This is done to avoid the user exiting from consmuming metrics like for-await and still see the process up.
                        if (this.#inflightNodes.size === 0) {
                            this.push(null);
                        }
                        return;
                    }
                    this.#pushRecords(metadata, topicIds, response, requestedOffsets);
                });
            }
        });
    }
    #pushRecords(metadata, topicIds, response, requestedOffsets) {
        const autocommit = this.#autocommitEnabled;
        let canPush = true;
        const keyDeserializer = this.#keyDeserializer;
        const valueDeserializer = this.#valueDeserializer;
        const headerKeyDeserializer = this.#headerKeyDeserializer;
        const headerValueDeserializer = this.#headerValueDeserializer;
        let diagnosticContext;
        // Parse results
        for (const topicResponse of response.responses) {
            const topic = topicIds.get(topicResponse.topicId);
            for (const { records, partitionIndex: partition } of topicResponse.partitions) {
                if (!records) {
                    continue;
                }
                const firstTimestamp = records.firstTimestamp;
                const firstOffset = records.firstOffset;
                const leaderEpoch = metadata.topics.get(topic).partitions[partition].leaderEpoch;
                for (const record of records.records) {
                    const offset = records.firstOffset + BigInt(record.offsetDelta);
                    if (offset < requestedOffsets.get(`${topic}:${partition}`)) {
                        // Thi is a duplicate message, ignore it
                        continue;
                    }
                    diagnosticContext = createDiagnosticContext({
                        client: this.#consumer,
                        stream: this,
                        operation: 'receive',
                        raw: record
                    });
                    consumerReceivesChannel.start.publish(diagnosticContext);
                    const commit = autocommit ? noopCallback : this.#commit.bind(this, topic, partition, offset, leaderEpoch);
                    try {
                        const headers = new Map();
                        for (const [headerKey, headerValue] of record.headers) {
                            headers.set(headerKeyDeserializer(headerKey), headerValueDeserializer(headerValue));
                        }
                        const key = keyDeserializer(record.key, headers);
                        const value = valueDeserializer(record.value, headers);
                        this.#metricsConsumedMessages?.inc();
                        const message = {
                            key,
                            value,
                            headers,
                            topic,
                            partition,
                            timestamp: firstTimestamp + record.timestampDelta,
                            offset,
                            commit
                        };
                        diagnosticContext.result = message;
                        consumerReceivesChannel.asyncStart.publish(diagnosticContext);
                        canPush = this.push(message);
                        consumerReceivesChannel.asyncEnd.publish(diagnosticContext);
                    }
                    catch (error) {
                        const shouldDestroy = this.#corruptedMessageHandler(record, topic, partition, firstTimestamp, firstOffset, commit);
                        if (shouldDestroy) {
                            diagnosticContext.error = error;
                            consumerReceivesChannel.error.publish(diagnosticContext);
                            this.destroy(new UserError('Failed to deserialize a message.', { cause: error }));
                            return;
                        }
                    }
                    finally {
                        consumerReceivesChannel.end.publish(diagnosticContext);
                    }
                }
                // Track the last read offset
                const lastOffset = records.firstOffset + BigInt(records.lastOffsetDelta);
                this.#offsetsToFetch.set(`${topic}:${partition}`, lastOffset + 1n);
                // Autocommit if needed
                if (autocommit) {
                    this.#offsetsToCommit.set(`${topic}:${partition}`, { topic, partition, offset: lastOffset, leaderEpoch });
                }
            }
        }
        if (this.#autocommitEnabled && !this.#autocommitInterval) {
            this.#autocommit();
        }
        if (canPush && !(this.#shouldClose || this.closed || this.destroyed)) {
            process.nextTick(() => {
                this.#fetch();
            });
        }
    }
    // This could optimized to only schedule once per tick on a topic-partition and only commit the latest offset
    #commit(topic, partition, offset, leaderEpoch, callback) {
        if (!callback) {
            callback = createPromisifiedCallback();
        }
        this.#consumer.commit({ offsets: [{ topic, partition, offset, leaderEpoch }] }, callback);
        return callback[kCallbackPromise];
    }
    #autocommit() {
        if (this.#offsetsToCommit.size === 0) {
            return;
        }
        this.#autocommitInflight = true;
        const offsets = Array.from(this.#offsetsToCommit.values());
        this.#offsetsToCommit.clear();
        this.#consumer.commit({ offsets }, error => {
            this.#autocommitInflight = false;
            if (error) {
                this.emit('autocommit', error);
                this.destroy(error);
                return;
            }
            this.emit('autocommit', null, offsets);
        });
    }
    #refreshOffsets(callback) {
        /* c8 ignore next 4 - Hard to test */
        if (this.#topics.length === 0) {
            callback(null);
            return;
        }
        // List topic offsets
        this.#consumer.listOffsets({
            topics: this.#topics,
            timestamp: this.#mode === MessagesStreamModes.EARLIEST ||
                (this.#mode !== MessagesStreamModes.LATEST && this.#fallbackMode === MessagesStreamFallbackModes.EARLIEST)
                ? ListOffsetTimestamps.EARLIEST
                : ListOffsetTimestamps.LATEST
        }, (error, offsets) => {
            if (error) {
                callback(error);
                return;
            }
            if (this.#mode !== MessagesStreamModes.COMMITTED) {
                this.#assignOffsets(offsets, new Map(), callback);
                return;
            }
            // Now restore group offsets
            const topics = [];
            for (const topic of this.#topics) {
                const assignment = this.#assignmentsForTopic(topic);
                if (!assignment) {
                    continue;
                }
                topics.push(assignment);
            }
            if (!topics.length) {
                this.#assignOffsets(offsets, new Map(), callback);
                return;
            }
            this.#consumer.listCommittedOffsets({ topics }, (error, commits) => {
                if (error) {
                    callback(error);
                    return;
                }
                this.#assignOffsets(offsets, commits, callback);
            });
        });
    }
    #assignOffsets(offsets, commits, callback) {
        for (const [topic, partitions] of offsets) {
            for (let i = 0; i < partitions.length; i++) {
                if (!this.#offsetsToFetch.has(`${topic}:${i}`)) {
                    this.#offsetsToFetch.set(`${topic}:${i}`, partitions[i]);
                }
            }
        }
        for (const [topic, partitions] of commits) {
            for (let i = 0; i < partitions.length; i++) {
                const offset = partitions[i];
                if (offset >= 0n) {
                    this.#offsetsToFetch.set(`${topic}:${i}`, offset + 1n);
                }
                else if (this.#fallbackMode === MessagesStreamFallbackModes.FAIL) {
                    callback(new UserError(`Topic ${topic} has no committed offset on partition ${i} for group ${this.#consumer.groupId}.`, { topic, partition: i, groupId: this.#consumer.groupId }));
                    return;
                }
            }
        }
        callback(null);
    }
    #assignmentsForTopic(topic) {
        return this.#consumer.assignments.find(assignment => assignment.topic === topic);
    }
    #invokeCloseCallbacks(error) {
        for (const callback of this.#closeCallbacks) {
            callback(error);
        }
        this.#closeCallbacks = [];
    }
    /* c8 ignore next 3 - This is a private API used to debug during development */
    [kInspect](...args) {
        this.#consumer[kInspect](...args);
    }
}
