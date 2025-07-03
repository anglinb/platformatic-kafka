import { createPromisifiedCallback, kCallbackPromise, runConcurrentCallbacks } from "../../apis/callbacks.js";
import { ProduceAcks } from "../../apis/enumerations.js";
import { createDiagnosticContext, producerInitIdempotentChannel, producerSendsChannel } from "../../diagnostic.js";
import { UserError } from "../../errors.js";
import { murmur2 } from "../../protocol/murmur2.js";
import { NumericMap } from "../../utils.js";
import { Base, kAfterCreate, kCheckNotClosed, kClearMetadata, kClosed, kGetApi, kGetBootstrapConnection, kGetConnection, kMetadata, kOptions, kPerformDeduplicated, kPerformWithRetry, kPrometheus, kValidateOptions } from "../base/base.js";
import { ensureMetric } from "../metrics.js";
import { produceOptionsValidator, producerOptionsValidator, sendOptionsValidator } from "./options.js";
// Don't move this function as being in the same file will enable V8 to remove.
// For futher info, ask Matteo.
export function noopSerializer(data) {
    return data;
}
export class Producer extends Base {
    #partitionsRoundRobin;
    // These two values should be serializable and loadable in the constructor in order to restore
    // the idempotent producer status.
    #producerInfo;
    #sequences;
    #keySerializer;
    #valueSerializer;
    #headerKeySerializer;
    #headerValueSerializer;
    #metricsProducedMessages;
    constructor(options) {
        if (options.idempotent) {
            options.maxInflights = 1;
            options.acks = ProduceAcks.ALL;
            options.retries = Number.MAX_SAFE_INTEGER;
        }
        else {
            options.idempotent = false;
        }
        options.repeatOnStaleMetadata ??= true;
        super(options);
        this.#partitionsRoundRobin = new NumericMap();
        this.#sequences = new NumericMap();
        this.#keySerializer = options.serializers?.key ?? noopSerializer;
        this.#valueSerializer = options.serializers?.value ?? noopSerializer;
        this.#headerKeySerializer = options.serializers?.headerKey ?? noopSerializer;
        this.#headerValueSerializer = options.serializers?.headerValue ?? noopSerializer;
        this[kValidateOptions](options, producerOptionsValidator, '/options');
        if (this[kPrometheus]) {
            ensureMetric(this[kPrometheus], 'Gauge', 'kafka_producers', 'Number of active Kafka producers').inc();
            this.#metricsProducedMessages = ensureMetric(this[kPrometheus], 'Counter', 'kafka_produced_messages', 'Number of produced Kafka messages');
        }
        this[kAfterCreate]('producer');
    }
    get producerId() {
        return this.#producerInfo?.producerId;
    }
    get producerEpoch() {
        return this.#producerInfo?.producerEpoch;
    }
    close(callback) {
        if (!callback) {
            callback = createPromisifiedCallback();
        }
        if (this[kClosed]) {
            callback(null);
            return callback[kCallbackPromise];
        }
        this[kClosed] = true;
        super.close(error => {
            if (error) {
                this[kClosed] = false;
                callback(error);
                return;
            }
            if (this[kPrometheus]) {
                ensureMetric(this[kPrometheus], 'Gauge', 'kafka_producers', 'Number of active Kafka producers').dec();
            }
            callback(null);
        });
        return callback[kCallbackPromise];
    }
    initIdempotentProducer(options, callback) {
        if (!callback) {
            callback = createPromisifiedCallback();
        }
        if (this[kCheckNotClosed](callback)) {
            return callback[kCallbackPromise];
        }
        const validationError = this[kValidateOptions](options, produceOptionsValidator, '/options', false);
        if (validationError) {
            callback(validationError, undefined);
            return callback[kCallbackPromise];
        }
        producerInitIdempotentChannel.traceCallback(this.#initIdempotentProducer, 1, createDiagnosticContext({ client: this, operation: 'initIdempotentProducer', options }), this, options, callback);
        return callback[kCallbackPromise];
    }
    send(options, callback) {
        if (!callback) {
            callback = createPromisifiedCallback();
        }
        if (this[kCheckNotClosed](callback)) {
            return callback[kCallbackPromise];
        }
        const validationError = this[kValidateOptions](options, sendOptionsValidator, '/options', false);
        if (validationError) {
            callback(validationError, undefined);
            return callback[kCallbackPromise];
        }
        producerSendsChannel.traceCallback(this.#send, 1, createDiagnosticContext({ client: this, operation: 'send', options }), this, options, callback);
        return callback[kCallbackPromise];
    }
    #initIdempotentProducer(options, callback) {
        this[kPerformDeduplicated]('initProducerId', deduplicateCallback => {
            this[kPerformWithRetry]('initProducerId', retryCallback => {
                this[kGetBootstrapConnection]((error, connection) => {
                    if (error) {
                        retryCallback(error, undefined);
                        return;
                    }
                    this[kGetApi]('InitProducerId', (error, api) => {
                        if (error) {
                            retryCallback(error, undefined);
                            return;
                        }
                        api(connection, null, this[kOptions].timeout, options.producerId ?? this[kOptions].producerId ?? 0n, options.producerEpoch ?? this[kOptions].producerEpoch ?? 0, retryCallback);
                    });
                });
            }, (error, response) => {
                if (error) {
                    deduplicateCallback(error, undefined);
                    return;
                }
                this.#producerInfo = { producerId: response.producerId, producerEpoch: response.producerEpoch };
                deduplicateCallback(null, this.#producerInfo);
            }, 0);
        }, callback);
    }
    #send(options, callback) {
        options.idempotent ??= this[kOptions].idempotent;
        options.repeatOnStaleMetadata ??= this[kOptions].repeatOnStaleMetadata;
        options.partitioner ??= this[kOptions].partitioner;
        const { idempotent, partitioner } = options;
        if (idempotent) {
            options.acks ??= ProduceAcks.ALL;
        }
        else {
            options.acks ??= ProduceAcks.LEADER;
        }
        // We still need to initialize the producerId
        if (idempotent) {
            if (!this.#producerInfo) {
                const { messages, ...initOptions } = options;
                this.initIdempotentProducer(initOptions, error => {
                    if (error) {
                        callback(error, undefined);
                        return;
                    }
                    this.#send(options, callback);
                });
                return;
            }
            if (typeof options.producerId !== 'undefined' || typeof options.producerEpoch !== 'undefined') {
                callback(new UserError('Cannot specify producerId or producerEpoch when using idempotent producer.'), undefined);
                return;
            }
            if (options.acks !== ProduceAcks.ALL) {
                callback(new UserError('Idempotent producer requires acks to be ALL (-1).'), undefined);
                return;
            }
        }
        const produceOptions = {
            compression: options.compression ?? this[kOptions].compression,
            producerId: idempotent ? this.#producerInfo.producerId : options.producerId,
            producerEpoch: idempotent ? this.#producerInfo.producerEpoch : options.producerEpoch,
            sequences: idempotent ? this.#sequences : undefined
        };
        // Build messages records out of messages
        const topics = new Set();
        const messages = [];
        for (const message of options.messages) {
            const topic = message.topic;
            let headers = new Map();
            const serializedHeaders = new Map();
            if (message.headers) {
                headers =
                    message.headers instanceof Map
                        ? message.headers
                        : new Map(Object.entries(message.headers));
                for (const [key, value] of headers) {
                    serializedHeaders.set(this.#headerKeySerializer(key), this.#headerValueSerializer(value));
                }
            }
            const key = this.#keySerializer(message.key, headers);
            const value = this.#valueSerializer(message.value, headers);
            let partition = 0;
            if (typeof message.partition !== 'number') {
                if (partitioner) {
                    partition = partitioner(message);
                }
                else if (key) {
                    partition = murmur2(key) >>> 0;
                }
                else {
                    // Use the roundrobin
                    partition = this.#partitionsRoundRobin.postIncrement(topic, 1, -1);
                }
            }
            else {
                partition = message.partition;
            }
            topics.add(topic);
            messages.push({
                key,
                value,
                headers: serializedHeaders,
                topic,
                partition,
                timestamp: message.timestamp
            });
        }
        this.#performSend(Array.from(topics), messages, options, produceOptions, callback);
    }
    #performSend(topics, messages, sendOptions, produceOptions, callback) {
        // Get the metadata with the topic/partitions informations
        this[kMetadata]({ topics, autocreateTopics: sendOptions.autocreateTopics }, (error, metadata) => {
            if (error) {
                callback(error, undefined);
                return;
            }
            const messagesByDestination = new Map();
            // Track the number of messages per partition so we can update the sequence number
            const messagesPerPartition = new NumericMap();
            // Normalize the partition of all messages, then enqueue them to their destination
            for (const message of messages) {
                message.partition %= metadata.topics.get(message.topic).partitionsCount;
                const { topic, partition } = message;
                const leader = metadata.topics.get(topic).partitions[partition].leader;
                let destination = messagesByDestination.get(leader);
                if (!destination) {
                    destination = [];
                    messagesByDestination.set(leader, destination);
                }
                const messagePartitionKey = `${message.topic}:${partition}`;
                messagesPerPartition.postIncrement(messagePartitionKey, 1, 0);
                destination.push(message);
            }
            // Track nodes so that we can get their ID for delayed write reporting
            const nodes = [];
            runConcurrentCallbacks('Producing messages failed.', messagesByDestination, ([destination, destinationMessages], concurrentCallback) => {
                nodes.push(destination);
                this.#performSingleDestinationSend(topics, destinationMessages, this[kOptions].timeout, sendOptions.acks, sendOptions.autocreateTopics, sendOptions.repeatOnStaleMetadata, produceOptions, concurrentCallback);
            }, (error, apiResults) => {
                if (error) {
                    callback(error, undefined);
                    return;
                }
                this.#metricsProducedMessages?.inc(messages.length);
                const results = {};
                if (sendOptions.acks === ProduceAcks.NO_RESPONSE) {
                    const unwritableNodes = [];
                    for (let i = 0; i < apiResults.length; i++) {
                        if (apiResults[i] === false) {
                            unwritableNodes.push(nodes[i]);
                        }
                    }
                    results.unwritableNodes = unwritableNodes;
                }
                else {
                    const topics = [];
                    for (const result of apiResults) {
                        for (const { name, partitionResponses } of result.responses) {
                            for (const partitionResponse of partitionResponses) {
                                topics.push({
                                    topic: name,
                                    partition: partitionResponse.index,
                                    offset: partitionResponse.baseOffset
                                });
                                const partitionKey = `${name}:${partitionResponse.index}`;
                                this.#sequences.postIncrement(partitionKey, messagesPerPartition.get(partitionKey), 0);
                            }
                        }
                        results.offsets = topics;
                    }
                }
                callback(null, results);
            });
        });
    }
    #performSingleDestinationSend(topics, messages, timeout, acks, autocreateTopics, repeatOnStaleMetadata, produceOptions, callback) {
        // Get the metadata with the topic/partitions informations
        this[kMetadata]({ topics, autocreateTopics }, (error, metadata) => {
            if (error) {
                callback(error, undefined);
                return;
            }
            const { topic, partition } = messages[0];
            const leader = metadata.topics.get(topic).partitions[partition].leader;
            this[kPerformWithRetry]('produce', retryCallback => {
                this[kGetConnection](metadata.brokers.get(leader), (error, connection) => {
                    if (error) {
                        retryCallback(error, undefined);
                        return;
                    }
                    this[kGetApi]('Produce', (error, api) => {
                        if (error) {
                            retryCallback(error, undefined);
                            return;
                        }
                        api(connection, acks, timeout, messages, produceOptions, retryCallback);
                    });
                });
            }, (error, results) => {
                if (error) {
                    // If the last error was due to stale metadata, we retry the operation with this set of messages
                    // since the partition is already set, it should attempt on the new destination
                    const hasStaleMetadata = error.findBy('hasStaleMetadata', true);
                    if (hasStaleMetadata && repeatOnStaleMetadata) {
                        this[kClearMetadata]();
                        this.#performSingleDestinationSend(topics, messages, timeout, acks, autocreateTopics, false, produceOptions, callback);
                        return;
                    }
                    callback(error, undefined);
                    return;
                }
                callback(error, results);
            }, 0, [], (error) => {
                return repeatOnStaleMetadata && !!error.findBy('hasStaleMetadata', true);
            });
        });
    }
}
