import { protocolAPIsById } from "./protocol/apis.js";
import { protocolErrors, protocolErrorsCodesById } from "./protocol/errors.js";
const kGenericError = Symbol('plt.kafka.genericError');
const kMultipleErrors = Symbol('plt.kafka.multipleErrors');
export const ERROR_PREFIX = 'PLT_KFK_';
export const errorCodes = [
    'PLT_KFK_AUTHENTICATION',
    'PLT_KFK_MULTIPLE',
    'PLT_KFK_NETWORK',
    'PLT_KFK_PROTOCOL',
    'PLT_KFK_RESPONSE',
    'PLT_KFK_TIMEOUT',
    'PLT_KFK_UNEXPECTED_CORRELATION_ID',
    'PLT_KFK_UNFINISHED_WRITE_BUFFER',
    'PLT_KFK_UNSUPPORTED_API',
    'PLT_KFK_UNSUPPORTED_COMPRESSION',
    'PLT_KFK_UNSUPPORTED',
    'PLT_KFK_USER'
];
export class GenericError extends Error {
    code;
    [kGenericError];
    static isGenericError(error) {
        return error[kGenericError] === true;
    }
    constructor(code, message, { cause, ...rest } = {}) {
        super(message, cause ? { cause } : {});
        this.code = code;
        this[kGenericError] = true;
        Reflect.defineProperty(this, 'message', { enumerable: true });
        Reflect.defineProperty(this, 'code', { enumerable: true });
        if ('stack' in this) {
            Reflect.defineProperty(this, 'stack', { enumerable: true });
        }
        for (const [key, value] of Object.entries(rest)) {
            Reflect.defineProperty(this, key, { value, enumerable: true });
        }
        Reflect.defineProperty(this, kGenericError, { value: true, enumerable: false });
    }
    findBy(property, value) {
        if (this[property] === value) {
            return this;
        }
        return null;
    }
}
export class MultipleErrors extends AggregateError {
    code;
    [kGenericError];
    [kMultipleErrors];
    static code = 'PLT_KFK_MULTIPLE';
    static isGenericError(error) {
        return error[kGenericError] === true;
    }
    static isMultipleErrors(error) {
        return error[kMultipleErrors] === true;
    }
    constructor(message, errors, { cause, ...rest } = {}) {
        super(errors, message, cause ? { cause } : {});
        this.code = MultipleErrors.code;
        this[kGenericError] = true;
        this[kMultipleErrors] = true;
        Reflect.defineProperty(this, 'message', { enumerable: true });
        Reflect.defineProperty(this, 'code', { enumerable: true });
        if ('stack' in this) {
            Reflect.defineProperty(this, 'stack', { enumerable: true });
        }
        for (const [key, value] of Object.entries(rest)) {
            Reflect.defineProperty(this, key, { value, enumerable: true });
        }
        Reflect.defineProperty(this, kGenericError, { value: true, enumerable: false });
        Reflect.defineProperty(this, kMultipleErrors, { value: true, enumerable: false });
    }
    findBy(property, value) {
        if (this[property] === value) {
            return this;
        }
        for (const error of this.errors) {
            if (error[kGenericError] ? error.findBy(property, value) : error[property] === value) {
                return error;
            }
        }
        return null;
    }
}
export * from "./protocol/errors.js";
export class AuthenticationError extends GenericError {
    static code = 'PLT_KFK_AUTHENTICATION';
    constructor(message, properties = {}) {
        super(AuthenticationError.code, message, { canRetry: false, ...properties });
    }
}
export class NetworkError extends GenericError {
    static code = 'PLT_KFK_NETWORK';
    constructor(message, properties = {}) {
        super(NetworkError.code, message, properties);
    }
}
export class ProtocolError extends GenericError {
    constructor(codeOrId, properties = {}, response = undefined) {
        const { id, code, message, canRetry } = protocolErrors[typeof codeOrId === 'number' ? protocolErrorsCodesById[codeOrId] : codeOrId];
        super('PLT_KFK_PROTOCOL', message, {
            apiId: id,
            apiCode: code,
            canRetry,
            hasStaleMetadata: ['UNKNOWN_TOPIC_OR_PARTITION', 'LEADER_NOT_AVAILABLE', 'NOT_LEADER_OR_FOLLOWER'].includes(id),
            needsRejoin: ['MEMBER_ID_REQUIRED', 'UNKNOWN_MEMBER_ID', 'REBALANCE_IN_PROGRESS'].includes(id),
            rebalanceInProgress: id === 'REBALANCE_IN_PROGRESS',
            unknownMemberId: id === 'UNKNOWN_MEMBER_ID',
            memberId: response?.memberId,
            ...properties
        });
    }
}
export class ResponseError extends MultipleErrors {
    static code = 'PLT_KFK_RESPONSE';
    constructor(apiName, apiVersion, errors, response, properties = {}) {
        super(`Received response with error while executing API ${protocolAPIsById[apiName]}(v${apiVersion})`, Object.entries(errors).map(([path, errorCode]) => new ProtocolError(errorCode, { path }, response)), {
            ...properties,
            response
        });
        this.code = ResponseError.code;
    }
}
export class TimeoutError extends GenericError {
    static code = 'PLT_KFK_TIMEOUT';
    constructor(message, properties = {}) {
        super(NetworkError.code, message, properties);
    }
}
export class UnexpectedCorrelationIdError extends GenericError {
    static code = 'PLT_KFK_UNEXPECTED_CORRELATION_ID';
    constructor(message, properties = {}) {
        super(UnexpectedCorrelationIdError.code, message, { canRetry: false, ...properties });
    }
}
export class UnfinishedWriteBufferError extends GenericError {
    static code = 'PLT_KFK_UNFINISHED_WRITE_BUFFER';
    constructor(message, properties = {}) {
        super(UnfinishedWriteBufferError.code, message, { canRetry: false, ...properties });
    }
}
export class UnsupportedApiError extends GenericError {
    static code = 'PLT_KFK_UNSUPPORTED_API';
    constructor(message, properties = {}) {
        super(UnsupportedApiError.code, message, { canRetry: false, ...properties });
    }
}
export class UnsupportedCompressionError extends GenericError {
    static code = 'PLT_KFK_UNSUPPORTED_COMPRESSION';
    constructor(message, properties = {}) {
        super(UnsupportedCompressionError.code, message, { canRetry: false, ...properties });
    }
}
export class UnsupportedError extends GenericError {
    static code = 'PLT_KFK_UNSUPPORTED';
    constructor(message, properties = {}) {
        super(UnsupportedError.code, message, { canRetry: false, ...properties });
    }
}
export class UserError extends GenericError {
    static code = 'PLT_KFK_USER';
    constructor(message, properties = {}) {
        super(UserError.code, message, { canRetry: false, ...properties });
    }
}
