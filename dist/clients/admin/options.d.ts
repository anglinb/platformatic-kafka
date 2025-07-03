export declare const groupsProperties: {
    groups: {
        type: string;
        items: {
            type: string;
            pattern: string;
        };
        minItems: number;
    };
};
export declare const createTopicOptionsSchema: {
    type: string;
    properties: {
        topics: {
            type: string;
            items: {
                type: string;
                pattern: string;
            };
        };
        partitions: {
            type: string;
        };
        replicas: {
            type: string;
        };
        assignments: {
            type: string;
            items: {
                type: string;
                properties: {
                    partition: {
                        type: string;
                        minimum: number;
                    };
                    brokers: {
                        type: string;
                        items: {
                            type: string;
                        };
                        minItems: number;
                    };
                };
                required: string[];
                additionalProperties: boolean;
            };
            minItems: number;
        };
    };
    required: string[];
    additionalProperties: boolean;
};
export declare const listTopicOptionsSchema: {
    type: string;
    properties: {
        includeInternals: {
            type: string;
            default: boolean;
        };
    };
    additionalProperties: boolean;
};
export declare const deleteTopicOptionsSchema: {
    type: string;
    properties: {
        topics: {
            type: string;
            items: {
                type: string;
                pattern: string;
            };
        };
    };
    required: string[];
    additionalProperties: boolean;
};
export declare const listGroupsOptionsSchema: {
    type: string;
    properties: {
        states: {
            type: string;
            items: {
                type: string;
                enumeration: {
                    allowed: readonly ["PREPARING_REBALANCE", "COMPLETING_REBALANCE", "STABLE", "DEAD", "EMPTY"];
                    errorMessage: string;
                };
            };
            minItems: number;
        };
        types: {
            type: string;
            items: {
                type: string;
                pattern: string;
            };
            minItems: number;
        };
    };
    additionalProperties: boolean;
};
export declare const describeGroupsOptionsSchema: {
    type: string;
    properties: {
        includeAuthorizedOperations: {
            type: string;
        };
        groups: {
            type: string;
            items: {
                type: string;
                pattern: string;
            };
            minItems: number;
        };
    };
    required: string[];
    additionalProperties: boolean;
};
export declare const deleteGroupsOptionsSchema: {
    type: string;
    properties: {
        groups: {
            type: string;
            items: {
                type: string;
                pattern: string;
            };
            minItems: number;
        };
    };
    required: string[];
    additionalProperties: boolean;
};
export declare const createTopicsOptionsValidator: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
export declare const listTopicsOptionsValidator: import("ajv").ValidateFunction<unknown>;
export declare const deleteTopicsOptionsValidator: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
export declare const listGroupsOptionsValidator: import("ajv").ValidateFunction<unknown>;
export declare const describeGroupsOptionsValidator: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
export declare const deleteGroupsOptionsValidator: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
