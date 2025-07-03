export declare const produceOptionsProperties: {
    producerId: {
        bigint: boolean;
    };
    producerEpoch: {
        type: string;
    };
    idempotent: {
        type: string;
    };
    acks: {
        type: string;
        enumeration: {
            allowed: (0 | 1 | -1)[];
            errorMessage: string;
        };
    };
    compression: {
        type: string;
        enumeration: {
            allowed: string[];
            errorMessage: string;
        };
    };
    partitioner: {
        function: boolean;
    };
    autocreateTopics: {
        type: string;
    };
    repeatOnStaleMetadata: {
        type: string;
    };
};
export declare const produceOptionsSchema: {
    type: string;
    properties: {
        producerId: {
            bigint: boolean;
        };
        producerEpoch: {
            type: string;
        };
        idempotent: {
            type: string;
        };
        acks: {
            type: string;
            enumeration: {
                allowed: (0 | 1 | -1)[];
                errorMessage: string;
            };
        };
        compression: {
            type: string;
            enumeration: {
                allowed: string[];
                errorMessage: string;
            };
        };
        partitioner: {
            function: boolean;
        };
        autocreateTopics: {
            type: string;
        };
        repeatOnStaleMetadata: {
            type: string;
        };
    };
    additionalProperties: boolean;
};
export declare const produceOptionsValidator: import("ajv").ValidateFunction<unknown>;
export declare const producerOptionsValidator: import("ajv").ValidateFunction<unknown>;
export declare const sendOptionsSchema: {
    type: string;
    properties: {
        producerId: {
            bigint: boolean;
        };
        producerEpoch: {
            type: string;
        };
        idempotent: {
            type: string;
        };
        acks: {
            type: string;
            enumeration: {
                allowed: (0 | 1 | -1)[];
                errorMessage: string;
            };
        };
        compression: {
            type: string;
            enumeration: {
                allowed: string[];
                errorMessage: string;
            };
        };
        partitioner: {
            function: boolean;
        };
        autocreateTopics: {
            type: string;
        };
        repeatOnStaleMetadata: {
            type: string;
        };
        messages: {
            type: string;
            items: {
                type: string;
                properties: {
                    key: {
                        oneOf: ({
                            type: string;
                            buffer?: undefined;
                        } | {
                            buffer: boolean;
                            type?: undefined;
                        })[];
                    };
                    value: {
                        oneOf: ({
                            type: string;
                            buffer?: undefined;
                        } | {
                            buffer: boolean;
                            type?: undefined;
                        })[];
                    };
                    headers: {
                        anyOf: ({
                            map: boolean;
                            type?: undefined;
                            additionalProperties?: undefined;
                        } | {
                            type: string;
                            additionalProperties: boolean;
                            map?: undefined;
                        })[];
                    };
                    topic: {
                        type: string;
                    };
                    partition: {
                        type: string;
                    };
                    timestamp: {
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
export declare const sendOptionsValidator: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
