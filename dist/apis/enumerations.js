// SASL Authentication
export const SASLMechanisms = ['PLAIN', 'SCRAM-SHA-256', 'SCRAM-SHA-512'];
// Metadata API
// ./metadata/find-coordinator.ts
export const FindCoordinatorKeyTypes = { GROUP: 0, TRANSACTION: 1, SHARE: 2 };
// Producer API
export const ProduceAcks = {
    ALL: -1,
    NO_RESPONSE: 0,
    LEADER: 1
};
// Consumer API
// ./consumer/fetch.ts
export const FetchIsolationLevels = { READ_UNCOMMITTED: 0, READ_COMMITTED: 1 };
export const ListOffsetTimestamps = { LATEST: -1n, EARLIEST: -2n };
// Admin API
// ./admin/*-acls.ts - See: https://cwiki.apache.org/confluence/display/KAFKA/KIP-140%3A+Add+administrative+RPCs+for+adding%2C+deleting%2C+and+listing+ACLs
export const ResourceTypes = {
    UNKNOWN: 0,
    ANY: 1,
    TOPIC: 2,
    GROUP: 3,
    CLUSTER: 4,
    TRANSACTIONAL_ID: 5,
    DELEGATION_TOKEN: 6
};
export const ResourcePatternTypes = { UNKNOWN: 0, ANY: 1, MATCH: 2, LITERAL: 3, PREFIXED: 4 };
export const AclOperations = {
    UNKNOWN: 0,
    ANY: 1,
    ALL: 2,
    READ: 3,
    WRITE: 4,
    CREATE: 5,
    DELETE: 6,
    ALTER: 7,
    DESCRIBE: 8,
    CLUSTER_ACTION: 9,
    DESCRIBE_CONFIGS: 10,
    ALTER_CONFIGS: 11,
    IDEMPOTENT_WRITE: 12
};
export const AclPermissionTypes = { UNKNOWN: 0, ANY: 1, DENY: 2, ALLOW: 3 };
// ./admin/*-configs.ts
export const ConfigSources = {
    UNKNOWN: 0,
    TOPIC_CONFIG: 1,
    DYNAMIC_BROKER_CONFIG: 2,
    DYNAMIC_DEFAULT_BROKER_CONFIG: 3,
    STATIC_BROKER_CONFIG: 4,
    DEFAULT_CONFIG: 5,
    DYNAMIC_BROKER_LOGGER_CONFIG: 6
};
export const ConfigTypes = {
    UNKNOWN: 0,
    TOPIC: 2,
    BROKER: 4,
    BROKER_LOGGER: 8
};
export const IncrementalAlterConfigTypes = { SET: 0, DELETE: 1, APPEND: 2, SUBTRACT: 3 };
// ./admin/*-client-quotas.ts
export const ClientQuotaMatchTypes = { EXACT: 0, DEFAULT: 1, ANY: 2 };
// ./admin/*-scram-credentials.ts
export const ScramMechanisms = { UNKNOWN: 0, SCRAM_SHA_256: 1, SCRAM_SHA_512: 2 };
// ./admin/describe-cluster.ts
export const DescribeClusterEndpointTypes = { BROKERS: 1, CONTROLLERS: 2 };
// ./admin/list-groups.ts
export const ConsumerGroupStates = ['PREPARING_REBALANCE', 'COMPLETING_REBALANCE', 'STABLE', 'DEAD', 'EMPTY'];
// ./admin/list-transactions.ts
export const TransactionStates = [
    'EMPTY',
    'ONGOING',
    'PREPARE_ABORT',
    'COMMITTING',
    'ABORTING',
    'COMPLETE_COMMIT',
    'COMPLETE_ABORT'
];
// ./admin/update-features.ts
export const FeatureUpgradeTypes = { UPGRADE: 1, SAFE_DOWNGRADE: 2, UNSAFE_DOWNGRADE: 3 };
