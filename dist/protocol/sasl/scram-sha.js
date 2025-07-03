import { createHash, createHmac, pbkdf2Sync, randomBytes } from 'node:crypto';
import { createPromisifiedCallback, kCallbackPromise } from "../../apis/callbacks.js";
import { AuthenticationError } from "../../errors.js";
const GS2_HEADER = 'n,,';
const GS2_HEADER_BASE64 = Buffer.from(GS2_HEADER).toString('base64');
const HMAC_CLIENT_KEY = 'Client Key';
const HMAC_SERVER_KEY = 'Server Key';
const PARAMETERS_PARSER = /([^=]+)=(.+)/;
export const ScramAlgorithms = {
    'SHA-256': {
        keyLength: 32,
        algorithm: 'sha256',
        minIterations: 4096
    },
    'SHA-512': {
        keyLength: 64,
        algorithm: 'sha512',
        minIterations: 4096
    }
};
export function createNonce() {
    return randomBytes(16).toString('base64url');
}
export function sanitizeString(str) {
    return str.replaceAll('=', '=3D').replace(',', '=2C');
}
export function parseParameters(data) {
    const original = data.toString('utf-8');
    return {
        __original: original,
        ...Object.fromEntries(original.split(',').map(param => param.match(PARAMETERS_PARSER).slice(1, 3)))
    };
}
// h, hi, hmac and xor, are defined in https://datatracker.ietf.org/doc/html/rfc5802#section-2.2
export function h(definition, data) {
    return createHash(definition.algorithm).update(data).digest();
}
export function hi(definition, password, salt, iterations) {
    return pbkdf2Sync(password, salt, iterations, definition.keyLength, definition.algorithm);
}
export function hmac(definition, key, data) {
    return createHmac(definition.algorithm, key).update(data).digest();
}
export function xor(a, b) {
    if (a.byteLength !== b.byteLength) {
        throw new AuthenticationError('Buffers must have the same length.');
    }
    const result = Buffer.allocUnsafe(a.length);
    for (let i = 0; i < a.length; i++) {
        result[i] = a[i] ^ b[i];
    }
    return result;
}
export const defaultCrypto = {
    h,
    hi,
    hmac,
    xor
};
export function authenticate(authenticateAPI, connection, algorithm, username, password, crypto = defaultCrypto, callback) {
    if (!callback) {
        callback = createPromisifiedCallback();
    }
    const { h, hi, hmac, xor } = crypto;
    const definition = ScramAlgorithms[algorithm];
    if (!definition) {
        throw new AuthenticationError(`Unsupported SCRAM algorithm ${algorithm}`);
    }
    const clientNonce = createNonce();
    const clientFirstMessageBare = `n=${sanitizeString(username)},r=${clientNonce}`;
    // First of all, send the first message
    authenticateAPI(connection, Buffer.from(`${GS2_HEADER}${clientFirstMessageBare}`), (error, firstResponse) => {
        if (error) {
            callback(new AuthenticationError('Authentication failed.', { cause: error }), undefined);
            return;
        }
        const firstData = parseParameters(firstResponse.authBytes);
        // Extract some parameters
        const salt = Buffer.from(firstData.s, 'base64');
        const iterations = parseInt(firstData.i, 10);
        const serverNonce = firstData.r;
        const serverFirstMessage = firstData.__original;
        // Validate response
        if (!serverNonce.startsWith(clientNonce)) {
            callback(new AuthenticationError('Server nonce does not start with client nonce.'), undefined);
            return;
        }
        else if (definition.minIterations > iterations) {
            callback(new AuthenticationError(`Algorithm ${algorithm} requires at least ${definition.minIterations} iterations, while ${iterations} were requested.`), undefined);
            return;
        }
        // SaltedPassword  := Hi(Normalize(password), salt, i)
        // ClientKey       := HMAC(SaltedPassword, "Client Key")
        // StoredKey       := H(ClientKey)
        // AuthMessage     := ClientFirstMessageBare + "," ServerFirstMessage + "," + ClientFinalMessageWithoutProof
        // ClientSignature := HMAC(StoredKey, AuthMessage)
        // ClientProof     := ClientKey XOR ClientSignature
        // ServerKey       := HMAC(SaltedPassword, "Server Key")
        // ServerSignature := HMAC(ServerKey, AuthMessage)
        const saltedPassword = hi(definition, password, salt, iterations);
        const clientKey = hmac(definition, saltedPassword, HMAC_CLIENT_KEY);
        const storedKey = h(definition, clientKey);
        const clientFinalMessageWithoutProof = `c=${GS2_HEADER_BASE64},r=${serverNonce}`;
        const authMessage = `${clientFirstMessageBare},${serverFirstMessage},${clientFinalMessageWithoutProof}`;
        const clientSignature = hmac(definition, storedKey, authMessage);
        const clientProof = xor(clientKey, clientSignature);
        const serverKey = hmac(definition, saltedPassword, HMAC_SERVER_KEY);
        const serverSignature = hmac(definition, serverKey, authMessage);
        authenticateAPI(connection, Buffer.from(`${clientFinalMessageWithoutProof},p=${clientProof.toString('base64')}`), (error, lastResponse) => {
            if (error) {
                callback(new AuthenticationError('Authentication failed.', { cause: error }), undefined);
                return;
            }
            // Send the last message to the server
            const lastData = parseParameters(lastResponse.authBytes);
            if (lastData.e) {
                callback(new AuthenticationError(lastData.e), undefined);
                return;
            }
            else if (lastData.v !== serverSignature.toString('base64')) {
                callback(new AuthenticationError('Invalid server signature.'), undefined);
                return;
            }
            callback(null, lastResponse);
        });
    });
    return callback[kCallbackPromise];
}
