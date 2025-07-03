export declare const SASLMechanisms: readonly ["PLAIN", "SCRAM-SHA-256", "SCRAM-SHA-512"];
export type SASLMechanism = (typeof SASLMechanisms)[number];
export declare const FindCoordinatorKeyTypes: {
    readonly GROUP: 0;
    readonly TRANSACTION: 1;
    readonly SHARE: 2;
};
export type FindCoordinatorKeyType = keyof typeof FindCoordinatorKeyTypes;
export declare const ProduceAcks: {
    readonly ALL: -1;
    readonly NO_RESPONSE: 0;
    readonly LEADER: 1;
};
export type ProduceAck = keyof typeof ProduceAcks;
export declare const FetchIsolationLevels: {
    READ_UNCOMMITTED: number;
    READ_COMMITTED: number;
};
export type FetchIsolationLevel = keyof typeof FetchIsolationLevels;
export declare const ListOffsetTimestamps: {
    LATEST: bigint;
    EARLIEST: bigint;
};
export type ListOffsetTimestamp = keyof typeof ListOffsetTimestamps;
export declare const ResourceTypes: {
    readonly UNKNOWN: 0;
    readonly ANY: 1;
    readonly TOPIC: 2;
    readonly GROUP: 3;
    readonly CLUSTER: 4;
    readonly TRANSACTIONAL_ID: 5;
    readonly DELEGATION_TOKEN: 6;
};
export type ResourceType = keyof typeof ResourceTypes;
export declare const ResourcePatternTypes: {
    readonly UNKNOWN: 0;
    readonly ANY: 1;
    readonly MATCH: 2;
    readonly LITERAL: 3;
    readonly PREFIXED: 4;
};
export type ResourcePatternType = keyof typeof ResourcePatternTypes;
export declare const AclOperations: {
    readonly UNKNOWN: 0;
    readonly ANY: 1;
    readonly ALL: 2;
    readonly READ: 3;
    readonly WRITE: 4;
    readonly CREATE: 5;
    readonly DELETE: 6;
    readonly ALTER: 7;
    readonly DESCRIBE: 8;
    readonly CLUSTER_ACTION: 9;
    readonly DESCRIBE_CONFIGS: 10;
    readonly ALTER_CONFIGS: 11;
    readonly IDEMPOTENT_WRITE: 12;
};
export type AclOperation = keyof typeof AclOperations;
export declare const AclPermissionTypes: {
    readonly UNKNOWN: 0;
    readonly ANY: 1;
    readonly DENY: 2;
    readonly ALLOW: 3;
};
export type AclPermissionType = keyof typeof AclPermissionTypes;
export declare const ConfigSources: {
    readonly UNKNOWN: 0;
    readonly TOPIC_CONFIG: 1;
    readonly DYNAMIC_BROKER_CONFIG: 2;
    readonly DYNAMIC_DEFAULT_BROKER_CONFIG: 3;
    readonly STATIC_BROKER_CONFIG: 4;
    readonly DEFAULT_CONFIG: 5;
    readonly DYNAMIC_BROKER_LOGGER_CONFIG: 6;
};
export type ConfigSource = keyof typeof ConfigSources;
export declare const ConfigTypes: {
    readonly UNKNOWN: 0;
    readonly TOPIC: 2;
    readonly BROKER: 4;
    readonly BROKER_LOGGER: 8;
};
export type ConfigType = keyof typeof ConfigTypes;
export declare const IncrementalAlterConfigTypes: {
    SET: number;
    DELETE: number;
    APPEND: number;
    SUBTRACT: number;
};
export type IncrementalAlterConfigType = keyof typeof IncrementalAlterConfigTypes;
export declare const ClientQuotaMatchTypes: {
    readonly EXACT: 0;
    readonly DEFAULT: 1;
    readonly ANY: 2;
};
export type ClientQuotaMatchType = keyof typeof ClientQuotaMatchTypes;
export declare const ScramMechanisms: {
    readonly UNKNOWN: 0;
    readonly SCRAM_SHA_256: 1;
    readonly SCRAM_SHA_512: 2;
};
export type ScramMechanism = keyof typeof ScramMechanisms;
export declare const DescribeClusterEndpointTypes: {
    BROKERS: number;
    CONTROLLERS: number;
};
export type DescribeClusterEndpointType = keyof typeof DescribeClusterEndpointTypes;
export declare const ConsumerGroupStates: readonly ["PREPARING_REBALANCE", "COMPLETING_REBALANCE", "STABLE", "DEAD", "EMPTY"];
export type ConsumerGroupState = (typeof ConsumerGroupStates)[number];
export declare const TransactionStates: readonly ["EMPTY", "ONGOING", "PREPARE_ABORT", "COMMITTING", "ABORTING", "COMPLETE_COMMIT", "COMPLETE_ABORT"];
export type TransactionState = (typeof TransactionStates)[number];
export declare const FeatureUpgradeTypes: {
    readonly UPGRADE: 1;
    readonly SAFE_DOWNGRADE: 2;
    readonly UNSAFE_DOWNGRADE: 3;
};
export type FeatureUpgradeType = keyof typeof FeatureUpgradeTypes;
