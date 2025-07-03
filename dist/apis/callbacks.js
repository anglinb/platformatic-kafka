import { MultipleErrors } from "../errors.js";
export const kCallbackPromise = Symbol('plt.kafka.callbackPromise');
// This is only meaningful for testing
export const kNoopCallbackReturnValue = Symbol('plt.kafka.noopCallbackReturnValue');
export const noopCallback = () => {
    return Promise.resolve(kNoopCallbackReturnValue);
};
export function createPromisifiedCallback() {
    const { promise, resolve, reject } = Promise.withResolvers();
    function callback(error, payload) {
        if (error) {
            reject(error);
        }
        else {
            resolve(payload);
        }
    }
    callback[kCallbackPromise] = promise;
    return callback;
}
export function runConcurrentCallbacks(errorMessage, collection, operation, callback) {
    let remaining = Array.isArray(collection) ? collection.length : collection.size;
    let hasErrors = false;
    const errors = Array.from(Array(remaining));
    const results = Array.from(Array(remaining));
    let i = 0;
    function operationCallback(index, e, result) {
        if (e) {
            hasErrors = true;
            errors[index] = e;
        }
        else {
            results[index] = result;
        }
        remaining--;
        if (remaining === 0) {
            callback(hasErrors ? new MultipleErrors(errorMessage, errors) : null, results);
        }
    }
    for (const item of collection) {
        operation(item, operationCallback.bind(null, i++));
    }
}
