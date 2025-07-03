import { type ConsumerOptions } from './types.ts';
export declare const groupOptionsProperties: {
    sessionTimeout: {
        type: string;
        minimum: number;
    };
    rebalanceTimeout: {
        type: string;
        minimum: number;
    };
    heartbeatInterval: {
        type: string;
        minimum: number;
    };
    protocols: {
        type: string;
        items: {
            type: string;
            properties: {
                name: {
                    type: string;
                    pattern: string;
                };
                version: {
                    type: string;
                    minimum: number;
                };
                topics: {
                    type: string;
                    items: {
                        type: string;
                    };
                };
                metadata: {
                    oneOf: ({
                        type: string;
                        buffer?: undefined;
                    } | {
                        buffer: boolean;
                        type?: undefined;
                    })[];
                };
            };
        };
    };
    partitionAssigner: {
        function: boolean;
    };
};
export declare const groupOptionsAdditionalValidations: {
    rebalanceTimeout: {
        properties: {
            rebalanceTimeout: {
                type: string;
                minimum: number;
                gteProperty: string;
            };
        };
    };
    heartbeatInterval: {
        properties: {
            heartbeatInterval: {
                type: string;
                minimum: number;
                allOf: {
                    lteProperty: string;
                }[];
            };
        };
    };
};
export declare const consumeOptionsProperties: {
    autocommit: {
        oneOf: ({
            type: string;
            minimum?: undefined;
        } | {
            type: string;
            minimum: number;
        })[];
    };
    minBytes: {
        type: string;
        minimum: number;
    };
    maxBytes: {
        type: string;
        minimum: number;
    };
    maxWaitTime: {
        type: string;
        minimum: number;
    };
    isolationLevel: {
        type: string;
        enum: string[];
    };
    deserializers: {
        type: string;
        properties: {
            key: {
                function: boolean;
            };
            value: {
                function: boolean;
            };
            headerKey: {
                function: boolean;
            };
            headerValue: {
                function: boolean;
            };
        };
        additionalProperties: boolean;
    };
    highWaterMark: {
        type: string;
        minimum: number;
    };
};
export declare const groupOptionsSchema: {
    type: string;
    properties: {
        sessionTimeout: {
            type: string;
            minimum: number;
        };
        rebalanceTimeout: {
            type: string;
            minimum: number;
        };
        heartbeatInterval: {
            type: string;
            minimum: number;
        };
        protocols: {
            type: string;
            items: {
                type: string;
                properties: {
                    name: {
                        type: string;
                        pattern: string;
                    };
                    version: {
                        type: string;
                        minimum: number;
                    };
                    topics: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                    metadata: {
                        oneOf: ({
                            type: string;
                            buffer?: undefined;
                        } | {
                            buffer: boolean;
                            type?: undefined;
                        })[];
                    };
                };
            };
        };
        partitionAssigner: {
            function: boolean;
        };
    };
    additionalProperties: boolean;
};
export declare const consumeOptionsSchema: {
    type: string;
    properties: {
        autocommit: {
            oneOf: ({
                type: string;
                minimum?: undefined;
            } | {
                type: string;
                minimum: number;
            })[];
        };
        minBytes: {
            type: string;
            minimum: number;
        };
        maxBytes: {
            type: string;
            minimum: number;
        };
        maxWaitTime: {
            type: string;
            minimum: number;
        };
        isolationLevel: {
            type: string;
            enum: string[];
        };
        deserializers: {
            type: string;
            properties: {
                key: {
                    function: boolean;
                };
                value: {
                    function: boolean;
                };
                headerKey: {
                    function: boolean;
                };
                headerValue: {
                    function: boolean;
                };
            };
            additionalProperties: boolean;
        };
        highWaterMark: {
            type: string;
            minimum: number;
        };
        sessionTimeout: {
            type: string;
            minimum: number;
        };
        rebalanceTimeout: {
            type: string;
            minimum: number;
        };
        heartbeatInterval: {
            type: string;
            minimum: number;
        };
        protocols: {
            type: string;
            items: {
                type: string;
                properties: {
                    name: {
                        type: string;
                        pattern: string;
                    };
                    version: {
                        type: string;
                        minimum: number;
                    };
                    topics: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                    metadata: {
                        oneOf: ({
                            type: string;
                            buffer?: undefined;
                        } | {
                            buffer: boolean;
                            type?: undefined;
                        })[];
                    };
                };
            };
        };
        partitionAssigner: {
            function: boolean;
        };
        topics: {
            type: string;
            items: {
                type: string;
                pattern: string;
            };
        };
        mode: {
            type: string;
            enum: ("latest" | "earliest" | "committed" | "manual")[];
        };
        fallbackMode: {
            type: string;
            enum: ("latest" | "earliest" | "fail")[];
        };
        offsets: {
            type: string;
            items: {
                type: string;
                properties: {
                    topic: {
                        type: string;
                        pattern: string;
                    };
                    partition: {
                        type: string;
                        minimum: number;
                    };
                    offset: {
                        bigint: boolean;
                    };
                };
                required: string[];
                additionalProperties: boolean;
            };
        };
        onCorruptedMessage: {
            function: boolean;
        };
    };
    required: string[];
    additionalProperties: boolean;
};
export declare const consumerOptionsSchema: {
    type: string;
    properties: {
        autocommit: {
            oneOf: ({
                type: string;
                minimum?: undefined;
            } | {
                type: string;
                minimum: number;
            })[];
        };
        minBytes: {
            type: string;
            minimum: number;
        };
        maxBytes: {
            type: string;
            minimum: number;
        };
        maxWaitTime: {
            type: string;
            minimum: number;
        };
        isolationLevel: {
            type: string;
            enum: string[];
        };
        deserializers: {
            type: string;
            properties: {
                key: {
                    function: boolean;
                };
                value: {
                    function: boolean;
                };
                headerKey: {
                    function: boolean;
                };
                headerValue: {
                    function: boolean;
                };
            };
            additionalProperties: boolean;
        };
        highWaterMark: {
            type: string;
            minimum: number;
        };
        sessionTimeout: {
            type: string;
            minimum: number;
        };
        rebalanceTimeout: {
            type: string;
            minimum: number;
        };
        heartbeatInterval: {
            type: string;
            minimum: number;
        };
        protocols: {
            type: string;
            items: {
                type: string;
                properties: {
                    name: {
                        type: string;
                        pattern: string;
                    };
                    version: {
                        type: string;
                        minimum: number;
                    };
                    topics: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                    metadata: {
                        oneOf: ({
                            type: string;
                            buffer?: undefined;
                        } | {
                            buffer: boolean;
                            type?: undefined;
                        })[];
                    };
                };
            };
        };
        partitionAssigner: {
            function: boolean;
        };
        groupId: {
            type: string;
            pattern: string;
        };
    };
    required: string[];
    additionalProperties: boolean;
};
export declare const fetchOptionsSchema: {
    type: string;
    properties: {
        autocommit: {
            oneOf: ({
                type: string;
                minimum?: undefined;
            } | {
                type: string;
                minimum: number;
            })[];
        };
        minBytes: {
            type: string;
            minimum: number;
        };
        maxBytes: {
            type: string;
            minimum: number;
        };
        maxWaitTime: {
            type: string;
            minimum: number;
        };
        isolationLevel: {
            type: string;
            enum: string[];
        };
        deserializers: {
            type: string;
            properties: {
                key: {
                    function: boolean;
                };
                value: {
                    function: boolean;
                };
                headerKey: {
                    function: boolean;
                };
                headerValue: {
                    function: boolean;
                };
            };
            additionalProperties: boolean;
        };
        highWaterMark: {
            type: string;
            minimum: number;
        };
        sessionTimeout: {
            type: string;
            minimum: number;
        };
        rebalanceTimeout: {
            type: string;
            minimum: number;
        };
        heartbeatInterval: {
            type: string;
            minimum: number;
        };
        protocols: {
            type: string;
            items: {
                type: string;
                properties: {
                    name: {
                        type: string;
                        pattern: string;
                    };
                    version: {
                        type: string;
                        minimum: number;
                    };
                    topics: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                    metadata: {
                        oneOf: ({
                            type: string;
                            buffer?: undefined;
                        } | {
                            buffer: boolean;
                            type?: undefined;
                        })[];
                    };
                };
            };
        };
        partitionAssigner: {
            function: boolean;
        };
        node: {
            type: string;
            minimum: number;
        };
        topics: {
            type: string;
            items: {
                type: string;
                properties: {
                    topicId: {
                        type: string;
                    };
                    partitions: {
                        type: string;
                        items: {
                            type: string;
                            properties: {
                                partition: {
                                    type: string;
                                };
                                currentLeaderEpoch: {
                                    type: string;
                                };
                                fetchOffset: {
                                    bigint: boolean;
                                };
                                lastFetchedEpoch: {
                                    type: string;
                                };
                                partitionMaxBytes: {
                                    type: string;
                                };
                            };
                            required: string[];
                        };
                    };
                };
                required: string[];
            };
        };
    };
    required: string[];
    additionalProperties: boolean;
};
export declare const commitOptionsSchema: {
    type: string;
    properties: {
        offsets: {
            type: string;
            items: {
                type: string;
                properties: {
                    leaderEpoch: {
                        type: string;
                    };
                    topic: {
                        type: string;
                        pattern: string;
                    };
                    partition: {
                        type: string;
                        minimum: number;
                    };
                    offset: {
                        bigint: boolean;
                    };
                };
                required: string[];
                additionalProperties: boolean;
            };
        };
    };
    required: string[];
    additionalProperties: boolean;
};
export declare const listCommitsOptionsSchema: {
    type: string;
    properties: {
        topics: {
            type: string;
            items: {
                type: string;
                properties: {
                    topic: {
                        type: string;
                        pattern: string;
                    };
                    partitions: {
                        type: string;
                        items: {
                            type: string;
                            minimum: number;
                        };
                    };
                };
                required: string[];
                additionalProperties: boolean;
            };
        };
    };
    required: string[];
    additionalProperties: boolean;
};
export declare const listOffsetsOptionsSchema: {
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
            additionalProperties: {
                type: string;
                items: {
                    type: string;
                    minimum: number;
                };
            };
        };
        isolationLevel: {
            type: string;
            enum: string[];
        };
        timestamp: {
            bigint: boolean;
        };
    };
    required: string[];
    additionalProperties: boolean;
};
export declare const groupOptionsValidator: import("ajv").ValidateFunction<unknown>;
export declare const groupIdAndOptionsValidator: import("ajv").ValidateFunction<{
    groupId: any;
}>;
export declare const consumeOptionsValidator: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
export declare const consumerOptionsValidator: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
export declare const fetchOptionsValidator: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
export declare const commitOptionsValidator: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
export declare const listCommitsOptionsValidator: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
export declare const listOffsetsOptionsValidator: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
export declare const defaultConsumerOptions: Partial<ConsumerOptions<Buffer, Buffer, Buffer, Buffer>>;
