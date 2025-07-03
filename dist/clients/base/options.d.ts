import { type BaseOptions } from './types.ts';
export declare const clientSoftwareName = "platformatic-kafka";
export declare const clientSoftwareVersion: any;
export declare const idProperty: {
    type: string;
    pattern: string;
};
export declare const topicWithPartitionAndOffsetProperties: {
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
export declare const baseOptionsSchema: {
    type: string;
    properties: {
        clientId: {
            type: string;
            pattern: string;
        };
        bootstrapBrokers: {
            oneOf: ({
                type: string;
                items: {
                    type: string;
                    properties?: undefined;
                };
            } | {
                type: string;
                items: {
                    type: string;
                    properties: {
                        host: {
                            type: string;
                        };
                        port: {
                            type: string;
                            minimum: number;
                            maximum: number;
                        };
                    };
                };
            })[];
        };
        timeout: {
            type: string;
            minimum: number;
        };
        connectTimeout: {
            type: string;
            minimum: number;
        };
        retries: {
            oneOf: ({
                type: string;
                minimum: number;
            } | {
                type: string;
                minimum?: undefined;
            })[];
        };
        retryDelay: {
            type: string;
            minimum: number;
        };
        maxInflights: {
            type: string;
            minimum: number;
        };
        tls: {
            type: string;
            additionalProperties: boolean;
        };
        tlsServerName: {
            oneOf: {
                type: string;
            }[];
        };
        sasl: {
            type: string;
            properties: {
                mechanism: {
                    type: string;
                    enum: readonly ["PLAIN", "SCRAM-SHA-256", "SCRAM-SHA-512"];
                };
                username: {
                    type: string;
                };
                password: {
                    type: string;
                };
            };
            required: string[];
            additionalProperties: boolean;
        };
        metadataMaxAge: {
            type: string;
            minimum: number;
        };
        autocreateTopics: {
            type: string;
        };
        strict: {
            type: string;
        };
        metrics: {
            type: string;
            additionalProperties: boolean;
        };
    };
    required: string[];
    additionalProperties: boolean;
};
export declare const metadataOptionsSchema: {
    type: string;
    properties: {
        topics: {
            type: string;
            items: {
                type: string;
                pattern: string;
            };
        };
        autocreateTopics: {
            type: string;
        };
        forceUpdate: {
            type: string;
        };
        metadataMaxAge: {
            type: string;
            minimum: number;
        };
    };
    required: string[];
    additionalProperties: boolean;
};
export declare const baseOptionsValidator: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
export declare const metadataOptionsValidator: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
export declare const defaultPort = 9092;
export declare const defaultBaseOptions: Partial<BaseOptions>;
