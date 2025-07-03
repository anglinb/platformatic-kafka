declare const kGenericError: unique symbol;
declare const kMultipleErrors: unique symbol;
export declare const ERROR_PREFIX = "PLT_KFK_";
export declare const errorCodes: readonly ["PLT_KFK_AUTHENTICATION", "PLT_KFK_MULTIPLE", "PLT_KFK_NETWORK", "PLT_KFK_PROTOCOL", "PLT_KFK_RESPONSE", "PLT_KFK_TIMEOUT", "PLT_KFK_UNEXPECTED_CORRELATION_ID", "PLT_KFK_UNFINISHED_WRITE_BUFFER", "PLT_KFK_UNSUPPORTED_API", "PLT_KFK_UNSUPPORTED_COMPRESSION", "PLT_KFK_UNSUPPORTED", "PLT_KFK_USER"];
export type ErrorCode = (typeof errorCodes)[number];
export type ErrorProperties = {
    cause?: Error;
} & Record<string, any>;
export declare class GenericError extends Error {
    code: string;
    [index: string]: any;
    [kGenericError]: true;
    static isGenericError(error: Error): boolean;
    constructor(code: ErrorCode, message: string, { cause, ...rest }?: ErrorProperties);
    findBy<ErrorType extends GenericError = GenericError>(property: string, value: unknown): ErrorType | null;
}
export declare class MultipleErrors extends AggregateError {
    code: string;
    [index: string]: any;
    [kGenericError]: true;
    [kMultipleErrors]: true;
    static code: ErrorCode;
    static isGenericError(error: Error): boolean;
    static isMultipleErrors(error: Error): boolean;
    constructor(message: string, errors: Error[], { cause, ...rest }?: ErrorProperties);
    findBy<ErrorType extends GenericError | MultipleErrors = MultipleErrors>(property: string, value: unknown): ErrorType | null;
}
export * from './protocol/errors.ts';
export declare class AuthenticationError extends GenericError {
    static code: ErrorCode;
    constructor(message: string, properties?: ErrorProperties);
}
export declare class NetworkError extends GenericError {
    static code: ErrorCode;
    constructor(message: string, properties?: ErrorProperties);
}
export declare class ProtocolError extends GenericError {
    constructor(codeOrId: string | number, properties?: ErrorProperties, response?: unknown);
}
export declare class ResponseError extends MultipleErrors {
    static code: ErrorCode;
    constructor(apiName: number, apiVersion: number, errors: Record<string, number>, response: unknown, properties?: ErrorProperties);
}
export declare class TimeoutError extends GenericError {
    static code: ErrorCode;
    constructor(message: string, properties?: ErrorProperties);
}
export declare class UnexpectedCorrelationIdError extends GenericError {
    static code: ErrorCode;
    constructor(message: string, properties?: ErrorProperties);
}
export declare class UnfinishedWriteBufferError extends GenericError {
    static code: ErrorCode;
    constructor(message: string, properties?: ErrorProperties);
}
export declare class UnsupportedApiError extends GenericError {
    static code: ErrorCode;
    constructor(message: string, properties?: ErrorProperties);
}
export declare class UnsupportedCompressionError extends GenericError {
    static code: ErrorCode;
    constructor(message: string, properties?: ErrorProperties);
}
export declare class UnsupportedError extends GenericError {
    static code: ErrorCode;
    constructor(message: string, properties?: ErrorProperties);
}
export declare class UserError extends GenericError {
    static code: ErrorCode;
    constructor(message: string, properties?: ErrorProperties);
}
