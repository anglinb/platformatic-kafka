import { type CallbackWithPromise } from '../../apis/callbacks.ts';
import { type SASLAuthenticationAPI, type SaslAuthenticateResponse } from '../../apis/security/sasl-authenticate-v2.ts';
import { type Connection } from '../../network/connection.ts';
export declare function authenticate(authenticateAPI: SASLAuthenticationAPI, connection: Connection, username: string, password: string, callback: CallbackWithPromise<SaslAuthenticateResponse>): void;
export declare function authenticate(authenticateAPI: SASLAuthenticationAPI, connection: Connection, username: string, password: string): Promise<SaslAuthenticateResponse>;
