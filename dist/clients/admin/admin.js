import { createPromisifiedCallback, kCallbackPromise, runConcurrentCallbacks } from "../../apis/callbacks.js";
import { FindCoordinatorKeyTypes } from "../../apis/enumerations.js";
import { adminGroupsChannel, adminTopicsChannel, createDiagnosticContext } from "../../diagnostic.js";
import { Reader } from "../../protocol/reader.js";
import { Base, kAfterCreate, kCheckNotClosed, kGetApi, kGetBootstrapConnection, kGetConnection, kMetadata, kOptions, kPerformDeduplicated, kPerformWithRetry, kValidateOptions } from "../base/base.js";
import { createTopicsOptionsValidator, deleteGroupsOptionsValidator, deleteTopicsOptionsValidator, describeGroupsOptionsValidator, listGroupsOptionsValidator, listTopicsOptionsValidator } from "./options.js";
export class Admin extends Base {
    constructor(options) {
        super(options);
        this[kAfterCreate]('admin');
    }
    listTopics(options, callback) {
        if (!callback) {
            callback = createPromisifiedCallback();
        }
        if (this[kCheckNotClosed](callback)) {
            return callback[kCallbackPromise];
        }
        if (!options) {
            options = {};
        }
        const validationError = this[kValidateOptions](options, listTopicsOptionsValidator, '/options', false);
        if (validationError) {
            callback(validationError, undefined);
            return callback[kCallbackPromise];
        }
        adminTopicsChannel.traceCallback(this.#listTopics, 1, createDiagnosticContext({ client: this, operation: 'listTopics', options }), this, options, callback);
        return callback[kCallbackPromise];
    }
    createTopics(options, callback) {
        if (!callback) {
            callback = createPromisifiedCallback();
        }
        if (this[kCheckNotClosed](callback)) {
            return callback[kCallbackPromise];
        }
        const validationError = this[kValidateOptions](options, createTopicsOptionsValidator, '/options', false);
        if (validationError) {
            callback(validationError, undefined);
            return callback[kCallbackPromise];
        }
        adminTopicsChannel.traceCallback(this.#createTopics, 1, createDiagnosticContext({ client: this, operation: 'createTopics', options }), this, options, callback);
        return callback[kCallbackPromise];
    }
    deleteTopics(options, callback) {
        if (!callback) {
            callback = createPromisifiedCallback();
        }
        if (this[kCheckNotClosed](callback)) {
            return callback[kCallbackPromise];
        }
        const validationError = this[kValidateOptions](options, deleteTopicsOptionsValidator, '/options', false);
        if (validationError) {
            callback(validationError, undefined);
            return callback[kCallbackPromise];
        }
        adminTopicsChannel.traceCallback(this.#deleteTopics, 1, createDiagnosticContext({ client: this, operation: 'deleteTopics', options }), this, options, callback);
        return callback[kCallbackPromise];
    }
    listGroups(options, callback) {
        if (!callback) {
            callback = createPromisifiedCallback();
        }
        if (this[kCheckNotClosed](callback)) {
            return callback[kCallbackPromise];
        }
        if (!options) {
            options = {};
        }
        const validationError = this[kValidateOptions](options, listGroupsOptionsValidator, '/options', false);
        if (validationError) {
            callback(validationError, undefined);
            return callback[kCallbackPromise];
        }
        options.types ??= ['classic'];
        adminGroupsChannel.traceCallback(this.#listGroups, 1, createDiagnosticContext({ client: this, operation: 'listGroups', options }), this, options, callback);
        return callback[kCallbackPromise];
    }
    describeGroups(options, callback) {
        if (!callback) {
            callback = createPromisifiedCallback();
        }
        if (this[kCheckNotClosed](callback)) {
            return callback[kCallbackPromise];
        }
        const validationError = this[kValidateOptions](options, describeGroupsOptionsValidator, '/options', false);
        if (validationError) {
            callback(validationError, undefined);
            return callback[kCallbackPromise];
        }
        adminGroupsChannel.traceCallback(this.#describeGroups, 1, createDiagnosticContext({ client: this, operation: 'describeGroups', options }), this, options, callback);
        return callback[kCallbackPromise];
    }
    deleteGroups(options, callback) {
        if (!callback) {
            callback = createPromisifiedCallback();
        }
        if (this[kCheckNotClosed](callback)) {
            return callback[kCallbackPromise];
        }
        const validationError = this[kValidateOptions](options, deleteGroupsOptionsValidator, '/options', false);
        if (validationError) {
            callback(validationError, undefined);
            return callback[kCallbackPromise];
        }
        adminGroupsChannel.traceCallback(this.#deleteGroups, 1, createDiagnosticContext({ client: this, operation: 'deleteGroups', options }), this, options, callback);
        return callback[kCallbackPromise];
    }
    #listTopics(options, callback) {
        const includeInternals = options.includeInternals ?? false;
        this[kPerformDeduplicated]('metadata', deduplicateCallback => {
            this[kPerformWithRetry]('metadata', retryCallback => {
                this[kGetBootstrapConnection]((error, connection) => {
                    if (error) {
                        retryCallback(error, undefined);
                        return;
                    }
                    this[kGetApi]('Metadata', (error, api) => {
                        if (error) {
                            retryCallback(error, undefined);
                            return;
                        }
                        api(connection, null, false, false, retryCallback);
                    });
                });
            }, (error, metadata) => {
                if (error) {
                    deduplicateCallback(error, undefined);
                    return;
                }
                const topics = new Set();
                for (const { name, isInternal } of metadata.topics) {
                    /* c8 ignore next 3 - Sometimes internal topics might be returned by Kafka */
                    if (isInternal && !includeInternals) {
                        continue;
                    }
                    topics.add(name);
                }
                deduplicateCallback(null, Array.from(topics).sort());
            }, 0);
        }, callback);
    }
    #createTopics(options, callback) {
        const numPartitions = options.partitions ?? 1;
        const replicationFactor = options.replicas ?? 1;
        const assignments = [];
        for (const { partition, brokers } of options.assignments ?? []) {
            assignments.push({ partitionIndex: partition, brokerIds: brokers });
        }
        const requests = [];
        for (const topic of options.topics) {
            requests.push({
                name: topic,
                numPartitions,
                replicationFactor,
                assignments,
                configs: []
            });
        }
        this[kPerformDeduplicated]('createTopics', deduplicateCallback => {
            this[kPerformWithRetry]('createTopics', retryCallback => {
                this[kGetBootstrapConnection]((error, connection) => {
                    if (error) {
                        retryCallback(error, undefined);
                        return;
                    }
                    this[kGetApi]('CreateTopics', (error, api) => {
                        if (error) {
                            retryCallback(error, undefined);
                            return;
                        }
                        api(connection, requests, this[kOptions].timeout, false, retryCallback);
                    });
                });
            }, (error, response) => {
                if (error) {
                    deduplicateCallback(error, undefined);
                    return;
                }
                const created = [];
                for (const { name, topicId: id, numPartitions: partitions, replicationFactor: replicas, configs } of response.topics) {
                    const configuration = {};
                    for (const { name, value } of configs) {
                        configuration[name] = value;
                    }
                    created.push({ id, name, partitions, replicas, configuration });
                }
                deduplicateCallback(null, created);
            }, 0);
        }, callback);
    }
    #deleteTopics(options, callback) {
        this[kPerformDeduplicated]('deleteTopics', deduplicateCallback => {
            this[kPerformWithRetry]('deleteTopics', retryCallback => {
                this[kGetBootstrapConnection]((error, connection) => {
                    if (error) {
                        retryCallback(error, undefined);
                        return;
                    }
                    const requests = [];
                    for (const topic of options.topics) {
                        requests.push({ name: topic });
                    }
                    this[kGetApi]('DeleteTopics', (error, api) => {
                        if (error) {
                            retryCallback(error, undefined);
                            return;
                        }
                        api(connection, requests, this[kOptions].timeout, retryCallback);
                    });
                });
            }, deduplicateCallback, 0);
        }, error => callback(error));
    }
    #listGroups(options, callback) {
        // Find all the brokers in the cluster
        this[kMetadata]({ topics: [] }, (error, metadata) => {
            if (error) {
                callback(error, undefined);
                return;
            }
            runConcurrentCallbacks('Listing groups failed.', metadata.brokers, ([, broker], concurrentCallback) => {
                this[kGetConnection](broker, (error, connection) => {
                    if (error) {
                        concurrentCallback(error, undefined);
                        return;
                    }
                    this[kPerformWithRetry]('listGroups', retryCallback => {
                        this[kGetApi]('ListGroups', (error, api) => {
                            if (error) {
                                retryCallback(error, undefined);
                                return;
                            }
                            /* c8 ignore next 5 */
                            if (api.version === 4) {
                                api(connection, options.states ?? [], retryCallback);
                            }
                            else {
                                api(connection, options.states ?? [], options.types, retryCallback);
                            }
                        });
                    }, concurrentCallback, 0);
                });
            }, (error, results) => {
                if (error) {
                    callback(error, undefined);
                    return;
                }
                const groups = new Map();
                for (const result of results) {
                    for (const raw of result.groups) {
                        groups.set(raw.groupId, {
                            id: raw.groupId,
                            state: raw.groupState.toUpperCase(),
                            groupType: raw.groupType,
                            protocolType: raw.protocolType
                        });
                    }
                }
                callback(null, groups);
            });
        });
    }
    #describeGroups(options, callback) {
        this[kMetadata]({ topics: [] }, (error, metadata) => {
            if (error) {
                callback(error, undefined);
                return;
            }
            this.#findGroupCoordinator(options.groups, (error, response) => {
                if (error) {
                    callback(error, undefined);
                    return;
                }
                // Group the groups by coordinator
                const coordinators = new Map();
                for (const { key: group, nodeId: node } of response.coordinators) {
                    let coordinator = coordinators.get(node);
                    if (!coordinator) {
                        coordinator = [];
                        coordinators.set(node, coordinator);
                    }
                    coordinator.push(group);
                }
                runConcurrentCallbacks('Describing groups failed.', coordinators, ([node, groups], concurrentCallback) => {
                    this[kGetConnection](metadata.brokers.get(node), (error, connection) => {
                        if (error) {
                            concurrentCallback(error, undefined);
                            return;
                        }
                        this[kPerformWithRetry]('describeGroups', retryCallback => {
                            this[kGetApi]('DescribeGroups', (error, api) => {
                                if (error) {
                                    retryCallback(error, undefined);
                                    return;
                                }
                                api(connection, groups, options.includeAuthorizedOperations ?? false, retryCallback);
                            });
                        }, concurrentCallback, 0);
                    });
                }, (error, results) => {
                    if (error) {
                        callback(error, undefined);
                        return;
                    }
                    const groups = new Map();
                    for (const result of results) {
                        for (const raw of result.groups) {
                            const group = {
                                id: raw.groupId,
                                state: raw.groupState.toUpperCase(),
                                protocolType: raw.protocolType,
                                protocol: raw.protocolData,
                                members: new Map(),
                                authorizedOperations: raw.authorizedOperations
                            };
                            for (const member of raw.members) {
                                const reader = Reader.from(member.memberMetadata);
                                const memberMetadata = {
                                    version: reader.readInt16(),
                                    topics: reader.readArray(r => r.readString(false), false, false),
                                    metadata: reader.readBytes(false)
                                };
                                reader.reset(member.memberAssignment);
                                const memberAssignments = reader.readMap(r => {
                                    const topic = r.readString();
                                    return [topic, { topic, partitions: reader.readArray(r => r.readInt32(), true, false) }];
                                }, true, false);
                                group.members.set(member.memberId, {
                                    id: member.memberId,
                                    groupInstanceId: member.groupInstanceId,
                                    clientId: member.clientId,
                                    clientHost: member.clientHost,
                                    metadata: memberMetadata,
                                    assignments: memberAssignments
                                });
                            }
                            groups.set(group.id, group);
                        }
                    }
                    callback(null, groups);
                });
            });
        });
    }
    #deleteGroups(options, callback) {
        this[kMetadata]({ topics: [] }, (error, metadata) => {
            if (error) {
                callback(error);
                return;
            }
            this.#findGroupCoordinator(options.groups, (error, response) => {
                if (error) {
                    callback(error);
                    return;
                }
                // Group the groups by coordinator
                const coordinators = new Map();
                for (const { key: group, nodeId: node } of response.coordinators) {
                    let coordinator = coordinators.get(node);
                    if (!coordinator) {
                        coordinator = [];
                        coordinators.set(node, coordinator);
                    }
                    coordinator.push(group);
                }
                runConcurrentCallbacks('Deleting groups failed.', coordinators, ([node, groups], concurrentCallback) => {
                    this[kGetConnection](metadata.brokers.get(node), (error, connection) => {
                        if (error) {
                            concurrentCallback(error, undefined);
                            return;
                        }
                        this[kPerformWithRetry]('deleteGroups', retryCallback => {
                            this[kGetApi]('DeleteGroups', (error, api) => {
                                if (error) {
                                    retryCallback(error, undefined);
                                    return;
                                }
                                api(connection, groups, retryCallback);
                            });
                        }, concurrentCallback, 0);
                    });
                }, error => callback(error));
            });
        });
    }
    #findGroupCoordinator(groups, callback) {
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
                    api(connection, FindCoordinatorKeyTypes.GROUP, groups, retryCallback);
                });
            });
        }, (error, response) => {
            if (error) {
                callback(error, undefined);
                return;
            }
            callback(null, response);
        }, 0);
    }
}
