import { createPromisifiedCallback, kCallbackPromise, runConcurrentCallbacks } from "../../apis/callbacks.js";
import { FetchIsolationLevels, FindCoordinatorKeyTypes } from "../../apis/enumerations.js";
import { consumerCommitsChannel, consumerConsumesChannel, consumerFetchesChannel, consumerGroupChannel, consumerHeartbeatChannel, consumerOffsetsChannel, createDiagnosticContext } from "../../diagnostic.js";
import { UserError } from "../../errors.js";
import { Reader } from "../../protocol/reader.js";
import { Writer } from "../../protocol/writer.js";
import { Base, kAfterCreate, kCheckNotClosed, kClosed, kClosing, kCreateConnectionPool, kFetchConnections, kFormatValidationErrors, kGetApi, kGetBootstrapConnection, kGetConnection, kMetadata, kOptions, kPerformDeduplicated, kPerformWithRetry, kPrometheus, kValidateOptions } from "../base/base.js";
import { defaultBaseOptions } from "../base/options.js";
import { ensureMetric } from "../metrics.js";
import { MessagesStream } from "./messages-stream.js";
import { commitOptionsValidator, consumeOptionsValidator, consumerOptionsValidator, defaultConsumerOptions, fetchOptionsValidator, groupIdAndOptionsValidator, groupOptionsValidator, listCommitsOptionsValidator, listOffsetsOptionsValidator } from "./options.js";
import { roundRobinAssigner } from "./partitions-assigners.js";
import { TopicsMap } from "./topics-map.js";
export class Consumer extends Base {
    groupId;
    generationId;
    memberId;
    topics;
    assignments;
    #members;
    #membershipActive;
    #isLeader;
    #protocol;
    #coordinatorId;
    #heartbeatInterval;
    #streams;
    #partitionsAssigner;
    /*
      The following requests are blocking in Kafka:
  
      FetchRequest (soprattutto con maxWaitMs)
      JoinGroupRequest
      SyncGroupRequest
      OffsetCommitRequest
      ProduceRequest
      ListOffsetsRequest
      ListGroupsRequest
      DescribeGroupsRequest
  
      In order to avoid consumer group problems, we separate FetchRequest only on a separate connection.
    */
    [kFetchConnections];
    // Metrics
    #metricActiveStreams;
    constructor(options) {
        super(options);
        this[kOptions] = Object.assign({}, defaultBaseOptions, defaultConsumerOptions, options);
        this[kValidateOptions](options, consumerOptionsValidator, '/options');
        this.groupId = options.groupId;
        this.generationId = 0;
        this.memberId = null;
        this.topics = new TopicsMap();
        this.assignments = null;
        this.#members = new Map();
        this.#membershipActive = false;
        this.#isLeader = false;
        this.#protocol = null;
        this.#coordinatorId = null;
        this.#heartbeatInterval = null;
        this.#streams = new Set();
        this.#partitionsAssigner = this[kOptions].partitionAssigner ?? roundRobinAssigner;
        this.#validateGroupOptions(this[kOptions], groupIdAndOptionsValidator);
        // Initialize connection pool
        this[kFetchConnections] = this[kCreateConnectionPool]();
        if (this[kPrometheus]) {
            ensureMetric(this[kPrometheus], 'Gauge', 'kafka_consumers', 'Number of active Kafka consumers').inc();
            this.#metricActiveStreams = ensureMetric(this[kPrometheus], 'Gauge', 'kafka_consumers_streams', 'Number of active Kafka consumers streams');
            this.topics.setMetric(ensureMetric(this[kPrometheus], 'Gauge', 'kafka_consumers_topics', 'Number of topics being consumed'));
        }
        this[kAfterCreate]('consumer');
    }
    get streamsCount() {
        return this.#streams.size;
    }
    close(force, callback) {
        if (typeof force === 'function') {
            callback = force;
            force = false;
        }
        if (!callback) {
            callback = createPromisifiedCallback();
        }
        if (this[kClosed]) {
            callback(null);
            return callback[kCallbackPromise];
        }
        // Mark as closing to prevent new operations from starting
        this[kClosing] = true;
        const closer = this.#membershipActive
            ? this.#leaveGroup.bind(this)
            : function noopCloser(_, callback) {
                callback(null);
            };
        closer(force, error => {
            if (error) {
                this[kClosing] = false;
                callback(error);
                return;
            }
            // Only mark as closed after leaving the group
            this[kClosed] = true;
            this[kFetchConnections].close(error => {
                if (error) {
                    this[kClosed] = false;
                    this[kClosing] = false;
                    callback(error);
                    return;
                }
                super.close(error => {
                    if (error) {
                        this[kClosed] = false;
                        this[kClosing] = false;
                        callback(error);
                        return;
                    }
                    this.topics.clear();
                    if (this[kPrometheus]) {
                        ensureMetric(this[kPrometheus], 'Gauge', 'kafka_consumers', 'Number of active Kafka consumers').dec();
                    }
                    callback(null);
                });
            });
        });
        return callback[kCallbackPromise];
    }
    consume(options, callback) {
        if (!callback) {
            callback = createPromisifiedCallback();
        }
        if (this[kCheckNotClosed](callback)) {
            return callback[kCallbackPromise];
        }
        const validationError = this[kValidateOptions](options, consumeOptionsValidator, '/options', false);
        if (validationError) {
            callback(validationError, undefined);
            return callback[kCallbackPromise];
        }
        options.autocommit ??= this[kOptions].autocommit ?? true;
        options.maxBytes ??= this[kOptions].maxBytes;
        options.deserializers = Object.assign({}, options.deserializers, this[kOptions].deserializers);
        options.highWaterMark ??= this[kOptions].highWaterMark;
        this.#consume(options, callback);
        return callback[kCallbackPromise];
    }
    fetch(options, callback) {
        if (!callback) {
            callback = createPromisifiedCallback();
        }
        if (this[kCheckNotClosed](callback)) {
            return callback[kCallbackPromise];
        }
        const validationError = this[kValidateOptions](options, fetchOptionsValidator, '/options', false);
        if (validationError) {
            callback(validationError, undefined);
            return callback[kCallbackPromise];
        }
        consumerFetchesChannel.traceCallback(this.#fetch, 1, createDiagnosticContext({ client: this, operation: 'fetch', options }), this, options, callback);
        return callback[kCallbackPromise];
    }
    commit(options, callback) {
        if (!callback) {
            callback = createPromisifiedCallback();
        }
        if (this[kCheckNotClosed](callback)) {
            return callback[kCallbackPromise];
        }
        const validationError = this[kValidateOptions](options, commitOptionsValidator, '/options', false);
        if (validationError) {
            callback(validationError);
            return callback[kCallbackPromise];
        }
        consumerCommitsChannel.traceCallback(this.#commit, 1, createDiagnosticContext({ client: this, operation: 'commit', options }), this, options, callback);
        return callback[kCallbackPromise];
    }
    listOffsets(options, callback) {
        if (!callback) {
            callback = createPromisifiedCallback();
        }
        if (this[kCheckNotClosed](callback)) {
            return callback[kCallbackPromise];
        }
        const validationError = this[kValidateOptions](options, listOffsetsOptionsValidator, '/options', false);
        if (validationError) {
            callback(validationError, undefined);
            return callback[kCallbackPromise];
        }
        consumerOffsetsChannel.traceCallback(this.#listOffsets, 2, createDiagnosticContext({ client: this, operation: 'listOffsets', options }), this, false, options, callback);
        return callback[kCallbackPromise];
    }
    listOffsetsWithTimestamps(options, callback) {
        if (!callback) {
            callback = createPromisifiedCallback();
        }
        if (this[kCheckNotClosed](callback)) {
            return callback[kCallbackPromise];
        }
        const validationError = this[kValidateOptions](options, listOffsetsOptionsValidator, '/options', false);
        if (validationError) {
            callback(validationError, undefined);
            return callback[kCallbackPromise];
        }
        consumerOffsetsChannel.traceCallback(this.#listOffsets, 2, createDiagnosticContext({ client: this, operation: 'listOffsets', options }), this, true, options, callback);
        return callback[kCallbackPromise];
    }
    listCommittedOffsets(options, callback) {
        if (!callback) {
            callback = createPromisifiedCallback();
        }
        if (this[kCheckNotClosed](callback)) {
            return callback[kCallbackPromise];
        }
        const validationError = this[kValidateOptions](options, listCommitsOptionsValidator, '/options', false);
        if (validationError) {
            callback(validationError, undefined);
            return callback[kCallbackPromise];
        }
        consumerOffsetsChannel.traceCallback(this.#listCommittedOffsets, 1, createDiagnosticContext({ client: this, operation: 'listCommittedOffsets', options }), this, options, callback);
        return callback[kCallbackPromise];
    }
    findGroupCoordinator(callback) {
        if (!callback) {
            callback = createPromisifiedCallback();
        }
        if (this[kCheckNotClosed](callback)) {
            return callback[kCallbackPromise];
        }
        if (this.#coordinatorId) {
            callback(null, this.#coordinatorId);
            return callback[kCallbackPromise];
        }
        this.#findGroupCoordinator(callback);
        return callback[kCallbackPromise];
    }
    joinGroup(options, callback) {
        if (!callback) {
            callback = createPromisifiedCallback();
        }
        if (this[kCheckNotClosed](callback)) {
            return callback[kCallbackPromise];
        }
        const validationError = this[kValidateOptions](options, groupOptionsValidator, '/options', false);
        if (validationError) {
            callback(validationError, undefined);
            return callback[kCallbackPromise];
        }
        options.sessionTimeout ??= this[kOptions].sessionTimeout;
        options.rebalanceTimeout ??= this[kOptions].rebalanceTimeout;
        options.heartbeatInterval ??= this[kOptions].heartbeatInterval;
        options.protocols ??= this[kOptions].protocols;
        this.#validateGroupOptions(options);
        this.#membershipActive = true;
        this.#joinGroup(options, callback);
        return callback[kCallbackPromise];
    }
    leaveGroup(force, callback) {
        if (typeof force === 'function') {
            callback = force;
            force = false;
        }
        if (!callback) {
            callback = createPromisifiedCallback();
        }
        if (this[kCheckNotClosed](callback)) {
            return callback[kCallbackPromise];
        }
        this.#membershipActive = false;
        this.#leaveGroup(force, error => {
            if (error) {
                this.#membershipActive = true;
                callback(error);
                return;
            }
            callback(null);
        });
        return callback[kCallbackPromise];
    }
    #consume(options, callback) {
        consumerConsumesChannel.traceCallback(this.#performConsume, 2, createDiagnosticContext({ client: this, operation: 'consume', options }), this, options, true, callback);
    }
    #fetch(options, callback) {
        this[kPerformWithRetry]('fetch', retryCallback => {
            this[kMetadata]({ topics: this.topics.current }, (error, metadata) => {
                if (error) {
                    retryCallback(error, undefined);
                    return;
                }
                const broker = metadata.brokers.get(options.node);
                if (!broker) {
                    retryCallback(new UserError(`Cannot find broker with node id ${options.node}`), undefined);
                    return;
                }
                this[kFetchConnections].get(broker, (error, connection) => {
                    if (error) {
                        retryCallback(error, undefined);
                        return;
                    }
                    this[kGetApi]('Fetch', (error, api) => {
                        if (error) {
                            retryCallback(error, undefined);
                            return;
                        }
                        api(connection, options.maxWaitTime ?? this[kOptions].maxWaitTime, options.minBytes ?? this[kOptions].minBytes, options.maxBytes ?? this[kOptions].maxBytes, FetchIsolationLevels[options.isolationLevel ?? this[kOptions].isolationLevel], 0, 0, options.topics, [], '', retryCallback);
                    });
                });
            });
        }, callback, 0);
    }
    #commit(options, callback) {
        this.#performGroupOperation('commit', (connection, groupCallback) => {
            const topics = new Map();
            for (const { topic, partition, offset, leaderEpoch } of options.offsets) {
                let topicOffsets = topics.get(topic);
                if (!topicOffsets) {
                    topicOffsets = { name: topic, partitions: [] };
                    topics.set(topic, topicOffsets);
                }
                topicOffsets.partitions.push({
                    partitionIndex: partition,
                    committedOffset: offset,
                    committedLeaderEpoch: leaderEpoch,
                    committedMetadata: null
                });
            }
            this[kGetApi]('OffsetCommit', (error, api) => {
                if (error) {
                    groupCallback(error, undefined);
                    return;
                }
                api(connection, this.groupId, this.generationId, this.memberId, null, Array.from(topics.values()), groupCallback);
            });
        }, error => {
            callback(error);
        });
    }
    #listOffsets(withTimestamps, options, callback) {
        this[kMetadata]({ topics: options.topics }, (error, metadata) => {
            if (error) {
                callback(error, undefined);
                return;
            }
            const requests = new Map();
            for (const name of options.topics) {
                const topic = metadata.topics.get(name);
                const toInclude = options.partitions?.[name] ?? [];
                const hasPartitionsFilter = toInclude.length > 0;
                for (let i = 0; i < topic.partitionsCount; i++) {
                    if (hasPartitionsFilter && !toInclude.includes(i)) {
                        continue;
                    }
                    const partition = topic.partitions[i];
                    const { leader, leaderEpoch } = partition;
                    let leaderRequests = requests.get(leader);
                    if (!leaderRequests) {
                        leaderRequests = new Map();
                        requests.set(leader, leaderRequests);
                    }
                    let topicRequests = leaderRequests.get(name);
                    if (!topicRequests) {
                        topicRequests = { name, partitions: [] };
                        leaderRequests.set(name, topicRequests);
                    }
                    topicRequests.partitions.push({
                        partitionIndex: i,
                        currentLeaderEpoch: leaderEpoch,
                        timestamp: options.timestamp ?? -1n
                    });
                }
            }
            runConcurrentCallbacks('Listing offsets failed.', requests, ([leader, requests], concurrentCallback) => {
                this[kPerformWithRetry]('listOffsets', retryCallback => {
                    this[kGetConnection](metadata.brokers.get(leader), (error, connection) => {
                        if (error) {
                            retryCallback(error, undefined);
                            return;
                        }
                        this[kGetApi]('ListOffsets', (error, api) => {
                            if (error) {
                                retryCallback(error, undefined);
                                return;
                            }
                            api(connection, -1, FetchIsolationLevels[options.isolationLevel ?? this[kOptions].isolationLevel], Array.from(requests.values()), retryCallback);
                        });
                    });
                }, concurrentCallback, 0);
            }, (error, responses) => {
                if (error) {
                    callback(error, undefined);
                    return;
                }
                let offsets = new Map();
                if (withTimestamps) {
                    offsets = new Map();
                    for (const response of responses) {
                        for (const { name: topic, partitions } of response.topics) {
                            let topicOffsets = offsets.get(topic);
                            if (!topicOffsets) {
                                topicOffsets = new Map();
                                offsets.set(topic, topicOffsets);
                            }
                            for (const { partitionIndex: index, offset, timestamp } of partitions) {
                                topicOffsets.set(index, { offset, timestamp });
                            }
                        }
                    }
                }
                else {
                    offsets = new Map();
                    for (const response of responses) {
                        for (const { name: topic, partitions } of response.topics) {
                            let topicOffsets = offsets.get(topic);
                            if (!topicOffsets) {
                                topicOffsets = Array(metadata.topics.get(topic).partitionsCount);
                                offsets.set(topic, topicOffsets);
                            }
                            for (const { partitionIndex: index, offset } of partitions) {
                                topicOffsets[index] = offset;
                            }
                        }
                    }
                }
                callback(null, offsets);
            });
        });
    }
    #listCommittedOffsets(options, callback) {
        const topics = [];
        for (const { topic: name, partitions } of options.topics) {
            topics.push({ name, partitionIndexes: partitions });
        }
        this.#performGroupOperation('listCommits', (connection, groupCallback) => {
            this[kGetApi]('OffsetFetch', (error, api) => {
                if (error) {
                    groupCallback(error, undefined);
                    return;
                }
                api(connection, 
                // Note: once we start implementing KIP-848, the memberEpoch must be obtained
                [{ groupId: this.groupId, memberId: this.memberId, memberEpoch: -1, topics }], false, groupCallback);
            });
        }, (error, response) => {
            if (error) {
                callback(error, undefined);
                return;
            }
            const committed = new Map();
            for (const responseGroup of response.groups) {
                for (const responseTopic of responseGroup.topics) {
                    const topic = responseTopic.name;
                    const partitions = Array(responseTopic.partitions.length);
                    for (const { partitionIndex: index, committedOffset } of responseTopic.partitions) {
                        partitions[index] = committedOffset;
                    }
                    committed.set(topic, partitions);
                }
            }
            callback(null, committed);
        });
    }
    #findGroupCoordinator(callback) {
        if (this.#coordinatorId) {
            callback(null, this.#coordinatorId);
            return;
        }
        consumerGroupChannel.traceCallback(this.#performFindGroupCoordinator, 0, createDiagnosticContext({ client: this, operation: 'findGroupCoordinator' }), this, callback);
    }
    #joinGroup(options, callback) {
        consumerGroupChannel.traceCallback(this.#performJoinGroup, 1, createDiagnosticContext({ client: this, operation: 'joinGroup', options }), this, options, callback);
    }
    #leaveGroup(force, callback) {
        consumerGroupChannel.traceCallback(this.#performLeaveGroup, 1, createDiagnosticContext({ client: this, operation: 'leaveGroup', force }), this, force, callback);
    }
    #syncGroup(callback) {
        consumerGroupChannel.traceCallback(this.#performSyncGroup, 1, createDiagnosticContext({ client: this, operation: 'syncGroup' }), this, null, callback);
    }
    #heartbeat(options) {
        const eventPayload = { groupId: this.groupId, memberId: this.memberId, generationId: this.generationId };
        consumerHeartbeatChannel.traceCallback((this.#performDeduplicateGroupOperaton), 2, createDiagnosticContext({ client: this, operation: 'heartbeat' }), this, 'heartbeat', (connection, groupCallback) => {
            // We have left the group in the meanwhile, abort
            if (!this.#membershipActive) {
                this.emitWithDebug('consumer:heartbeat', 'cancel', eventPayload);
                return;
            }
            this.emitWithDebug('consumer:heartbeat', 'start', eventPayload);
            this[kGetApi]('Heartbeat', (error, api) => {
                if (error) {
                    groupCallback(error, undefined);
                    return;
                }
                api(connection, this.groupId, this.generationId, this.memberId, null, groupCallback);
            });
        }, error => {
            // The heartbeat has been aborted elsewhere, ignore the response
            if (this.#heartbeatInterval === null || !this.#membershipActive) {
                this.emitWithDebug('consumer:heartbeat', 'cancel', eventPayload);
                return;
            }
            if (error) {
                this.#cancelHeartbeat();
                if (this.#getRejoinError(error)) {
                    this[kPerformWithRetry]('rejoinGroup', retryCallback => {
                        this.#joinGroup(options, retryCallback);
                    }, error => {
                        if (error) {
                            this.emitWithDebug(null, 'error', error);
                        }
                        this.emitWithDebug('consumer', 'rejoin');
                    }, 0);
                    return;
                }
                this.emitWithDebug('consumer:heartbeat', 'error', { ...eventPayload, error });
                // Note that here we purposely do not return, since it was not a group related problem we schedule another heartbeat
            }
            else {
                this.emitWithDebug('consumer:heartbeat', 'end', eventPayload);
            }
            this.#heartbeatInterval?.refresh();
        });
    }
    #cancelHeartbeat() {
        clearTimeout(this.#heartbeatInterval);
        this.#heartbeatInterval = null;
    }
    #performConsume(options, trackTopics, callback) {
        // Subscribe all topics
        let joinNeeded = this.memberId === null;
        if (trackTopics) {
            for (const topic of options.topics) {
                if (this.topics.track(topic)) {
                    joinNeeded = true;
                }
            }
        }
        // If we need to (re)join the group, do that first and then try again
        if (joinNeeded) {
            this.joinGroup(options, error => {
                if (error) {
                    callback(error, undefined);
                    return;
                }
                this.#performConsume(options, false, callback);
            });
            return;
        }
        // Create the stream and start consuming
        const stream = new MessagesStream(this, options);
        this.#streams.add(stream);
        this.#metricActiveStreams?.inc();
        stream.once('close', () => {
            this.#metricActiveStreams?.dec();
            this.#streams.delete(stream);
        });
        callback(null, stream);
    }
    #performFindGroupCoordinator(callback) {
        this[kPerformDeduplicated]('findGroupCoordinator', deduplicateCallback => {
            this[kPerformWithRetry]('findGroupCoordinator', retryCallback => {
                this[kGetBootstrapConnection]((error, connection) => {
                    if (error) {
                        retryCallback(error, undefined);
                        return;
                    }
                    this[kGetApi]('FindCoordinator', (error, api) => {
                        if (error) {
                            retryCallback(error, undefined);
                            return;
                        }
                        api(connection, FindCoordinatorKeyTypes.GROUP, [this.groupId], retryCallback);
                    });
                });
            }, (error, response) => {
                if (error) {
                    deduplicateCallback(error, undefined);
                    return;
                }
                const groupInfo = response.coordinators.find(coordinator => coordinator.key === this.groupId);
                this.#coordinatorId = groupInfo.nodeId;
                deduplicateCallback(null, this.#coordinatorId);
            }, 0);
        }, callback);
    }
    #performJoinGroup(options, callback) {
        if (!this.#membershipActive) {
            callback(null, undefined);
            return;
        }
        this.#cancelHeartbeat();
        const protocols = [];
        for (const protocol of options.protocols) {
            protocols.push({
                name: protocol.name,
                metadata: this.#encodeProtocolSubscriptionMetadata(protocol, this.topics.current)
            });
        }
        this.#performDeduplicateGroupOperaton('joinGroup', (connection, groupCallback) => {
            this[kGetApi]('JoinGroup', (error, api) => {
                if (error) {
                    groupCallback(error, undefined);
                    return;
                }
                api(connection, this.groupId, options.sessionTimeout, options.rebalanceTimeout, this.memberId ?? '', null, 'consumer', protocols, '', groupCallback);
            });
        }, (error, response) => {
            if (!this.#membershipActive) {
                callback(null, undefined);
                return;
            }
            if (error) {
                if (this.#getRejoinError(error)) {
                    this.#performJoinGroup(options, callback);
                    return;
                }
                callback(error, undefined);
                return;
            }
            this.generationId = response.generationId;
            this.#isLeader = response.leader === this.memberId;
            this.#protocol = response.protocolName;
            this.#members = new Map();
            for (const member of response.members) {
                this.#members.set(member.memberId, this.#decodeProtocolSubscriptionMetadata(member.memberId, member.metadata));
            }
            // Send a syncGroup request
            this.#syncGroup((error, response) => {
                if (!this.#membershipActive) {
                    callback(null, undefined);
                    return;
                }
                if (error) {
                    if (this.#getRejoinError(error)) {
                        this.#performJoinGroup(options, callback);
                        return;
                    }
                    callback(error, undefined);
                    return;
                }
                this.assignments = response;
                this.#cancelHeartbeat();
                this.#heartbeatInterval = setTimeout(() => {
                    this.#heartbeat(options);
                }, options.heartbeatInterval);
                this.emitWithDebug('consumer', 'group:join', {
                    groupId: this.groupId,
                    memberId: this.memberId,
                    generationId: this.generationId,
                    isLeader: this.#isLeader,
                    assignments: this.assignments
                });
                callback(null, this.memberId);
            });
        });
    }
    #performLeaveGroup(force, callback) {
        if (!this.memberId) {
            callback(null);
            return;
        }
        // Remove streams that might have been exited in the meanwhile
        for (const stream of this.#streams) {
            if (stream.closed || stream.destroyed) {
                this.#streams.delete(stream);
            }
        }
        if (this.#streams.size) {
            if (!force) {
                callback(new UserError('Cannot leave group while consuming messages.'));
                return;
            }
            runConcurrentCallbacks('Closing streams failed.', this.#streams, (stream, concurrentCallback) => {
                stream.close(concurrentCallback);
            }, error => {
                if (error) {
                    callback(error);
                    return;
                }
                // All streams are closed, try the operation again without force
                this.#performLeaveGroup(false, callback);
            });
            return;
        }
        this.#cancelHeartbeat();
        this.#performDeduplicateGroupOperaton('leaveGroup', (connection, groupCallback) => {
            this[kGetApi]('LeaveGroup', (error, api) => {
                if (error) {
                    groupCallback(error, undefined);
                    return;
                }
                api(connection, this.groupId, [{ memberId: this.memberId }], groupCallback);
            });
        }, error => {
            if (error) {
                const unknownMemberError = error.findBy?.('unknownMemberId', true);
                // This is to avoid throwing an error if a group join was cancelled.
                if (!unknownMemberError) {
                    callback(error);
                    return;
                }
            }
            this.emitWithDebug('consumer', 'group:leave', {
                groupId: this.groupId,
                memberId: this.memberId,
                generationId: this.generationId
            });
            this.memberId = null;
            this.generationId = 0;
            this.assignments = null;
            callback(null);
        });
    }
    #performSyncGroup(assignments, callback) {
        if (!this.#membershipActive) {
            callback(null, []);
            return;
        }
        if (!Array.isArray(assignments)) {
            if (this.#isLeader) {
                // Get all the metadata for  the topics the consumer are listening to, then compute the assignments
                const topicsSubscriptions = new Map();
                for (const subscription of this.#members.values()) {
                    for (const topic of subscription.topics) {
                        let topicSubscriptions = topicsSubscriptions.get(topic);
                        if (!topicSubscriptions) {
                            topicSubscriptions = [];
                            topicsSubscriptions.set(topic, topicSubscriptions);
                        }
                        topicSubscriptions.push(subscription);
                    }
                }
                this[kMetadata]({ topics: Array.from(topicsSubscriptions.keys()) }, (error, metadata) => {
                    if (error) {
                        callback(error, undefined);
                        return;
                    }
                    this.#performSyncGroup(this.#createAssignments(metadata), callback);
                });
                return;
            }
            else {
                // Non leader simply do not send any assignments and wait
                assignments = [];
            }
        }
        this.#performDeduplicateGroupOperaton('syncGroup', (connection, groupCallback) => {
            this[kGetApi]('SyncGroup', (error, api) => {
                if (error) {
                    groupCallback(error, undefined);
                    return;
                }
                api(connection, this.groupId, this.generationId, this.memberId, null, 'consumer', this.#protocol, assignments, groupCallback);
            });
        }, (error, response) => {
            if (!this.#membershipActive) {
                callback(null, undefined);
                return;
            }
            if (error) {
                callback(error, undefined);
                return;
            }
            // Read the assignment back
            const reader = Reader.from(response.assignment);
            const assignments = reader.readArray(r => {
                return {
                    topic: r.readString(),
                    partitions: r.readArray(r => r.readInt32(), true, false)
                };
            }, true, false);
            callback(error, assignments);
        });
    }
    #performDeduplicateGroupOperaton(operationId, operation, callback) {
        return this[kPerformDeduplicated](operationId, deduplicateCallback => {
            this.#performGroupOperation(operationId, operation, deduplicateCallback);
        }, callback);
    }
    #performGroupOperation(operationId, operation, callback) {
        this.#findGroupCoordinator((error, coordinatorId) => {
            if (error) {
                callback(error, undefined);
                return;
            }
            this[kMetadata]({ topics: this.topics.current }, (error, metadata) => {
                if (error) {
                    callback(error, undefined);
                    return;
                }
                this[kPerformWithRetry](operationId, retryCallback => {
                    this[kGetConnection](metadata.brokers.get(coordinatorId), (error, connection) => {
                        if (error) {
                            retryCallback(error, undefined);
                            return;
                        }
                        operation(connection, retryCallback);
                    });
                }, callback);
            });
        });
    }
    #validateGroupOptions(options, validator) {
        validator ??= groupOptionsValidator;
        const valid = validator(options);
        if (!valid) {
            throw new UserError(this[kFormatValidationErrors](validator, '/options'));
        }
    }
    /*
      The following two methods follow:
      https://github.com/apache/kafka/blob/trunk/clients/src/main/resources/common/message/ConsumerProtocolSubscription.json
    */
    #encodeProtocolSubscriptionMetadata(metadata, topics) {
        return Writer.create()
            .appendInt16(metadata.version)
            .appendArray(topics, (w, t) => w.appendString(t, false), false, false)
            .appendBytes(typeof metadata.metadata === 'string' ? Buffer.from(metadata.metadata) : metadata.metadata, false)
            .buffer;
    }
    #decodeProtocolSubscriptionMetadata(memberId, buffer) {
        const reader = Reader.from(buffer);
        return {
            memberId,
            version: reader.readInt16(),
            topics: reader.readArray(r => r.readString(false), false, false),
            metadata: reader.readBytes(false)
        };
    }
    /*
      This follows:
      https://github.com/apache/kafka/blob/trunk/clients/src/main/resources/common/message/ConsumerProtocolAssignment.json
    */
    #encodeProtocolAssignment(assignments) {
        return Writer.create().appendArray(assignments, (w, { topic, partitions }) => {
            w.appendString(topic).appendArray(partitions, (w, a) => w.appendInt32(a), true, false);
        }, true, false).buffer;
    }
    #createAssignments(metadata) {
        const partitionTracker = new Map();
        // First of all, layout topics-partitions in a list
        for (const [topic, partitions] of metadata.topics) {
            partitionTracker.set(topic, { next: 0, max: partitions.partitionsCount });
        }
        // We are the only member of the group, assign all partitions to us
        const membersSize = this.#members.size;
        if (membersSize === 1) {
            const assignments = [];
            for (const topic of this.topics.current) {
                const partitionsCount = metadata.topics.get(topic).partitionsCount;
                const partitions = [];
                for (let i = 0; i < partitionsCount; i++) {
                    partitions.push(i);
                }
                assignments.push({ topic, partitions });
            }
            return [{ memberId: this.memberId, assignment: this.#encodeProtocolAssignment(assignments) }];
        }
        const encodedAssignments = [];
        for (const member of this.#partitionsAssigner(this.memberId, this.#members, new Set(this.topics.current), metadata)) {
            encodedAssignments.push({
                memberId: member.memberId,
                assignment: this.#encodeProtocolAssignment(Array.from(member.assignments.values()))
            });
        }
        return encodedAssignments;
    }
    #getRejoinError(error) {
        const protocolError = error.findBy?.('needsRejoin', true);
        if (!protocolError) {
            return null;
        }
        if (protocolError.rebalanceInProgress) {
            this.emitWithDebug('consumer', 'group:rebalance', { groupId: this.groupId });
        }
        if (protocolError.unknownMemberId) {
            this.memberId = null;
        }
        else if (protocolError.memberId && !this.memberId) {
            this.memberId = protocolError.memberId;
        }
        // This is only used in testing
        if (protocolError.cancelMembership) {
            this.#membershipActive = false;
        }
        return protocolError;
    }
}
