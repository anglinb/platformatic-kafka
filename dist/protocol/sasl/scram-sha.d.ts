import { type CallbackWithPromise } from '../../apis/callbacks.ts';
import { type SASLAuthenticationAPI, type SaslAuthenticateResponse } from '../../apis/security/sasl-authenticate-v2.ts';
import { type Connection } from '../../network/connection.ts';
export interface ScramAlgorithmDefinition {
    keyLength: number;
    algorithm: string;
    minIterations: number;
}
export interface ScramCryptoModule {
    h: (definition: ScramAlgorithmDefinition, data: string | Buffer) => Buffer;
    hi: (definition: ScramAlgorithmDefinition, password: string, salt: Buffer, iterations: number) => Buffer;
    hmac: (definition: ScramAlgorithmDefinition, key: Buffer, data: string | Buffer) => Buffer;
    xor: (a: Buffer, b: Buffer) => Buffer;
}
export declare const ScramAlgorithms: {
    readonly 'SHA-256': {
        readonly keyLength: 32;
        readonly algorithm: "sha256";
        readonly minIterations: 4096;
    };
    readonly 'SHA-512': {
        readonly keyLength: 64;
        readonly algorithm: "sha512";
        readonly minIterations: 4096;
    };
};
export type ScramAlgorithm = keyof typeof ScramAlgorithms;
export declare function createNonce(): string;
export declare function sanitizeString(str: string): string;
export declare function parseParameters(data: Buffer): Record<string, string>;
export declare function h(definition: ScramAlgorithmDefinition, data: string | Buffer): Buffer;
export declare function hi(definition: ScramAlgorithmDefinition, password: string, salt: Buffer, iterations: number): Buffer;
export declare function hmac(definition: ScramAlgorithmDefinition, key: Buffer, data: string | Buffer): Buffer;
export declare function xor(a: Buffer, b: Buffer): Buffer;
export declare const defaultCrypto: ScramCryptoModule;
export declare function authenticate(authenticateAPI: SASLAuthenticationAPI, connection: Connection, algorithm: ScramAlgorithm, username: string, password: string, crypto: ScramCryptoModule, callback: CallbackWithPromise<SaslAuthenticateResponse>): void;
export declare function authenticate(authenticateAPI: SASLAuthenticationAPI, connection: Connection, algorithm: ScramAlgorithm, username: string, password: string, crypto?: ScramCryptoModule): Promise<SaslAuthenticateResponse>;
