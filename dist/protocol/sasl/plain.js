import { createPromisifiedCallback, kCallbackPromise } from "../../apis/callbacks.js";
export function authenticate(authenticateAPI, connection, username, password, callback) {
    if (!callback) {
        callback = createPromisifiedCallback();
    }
    authenticateAPI(connection, Buffer.from(['', username, password].join('\0')), callback);
    return callback[kCallbackPromise];
}
