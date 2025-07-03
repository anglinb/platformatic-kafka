import { type Callback } from './definitions.ts';
export declare const kCallbackPromise: unique symbol;
export declare const kNoopCallbackReturnValue: unique symbol;
export declare const noopCallback: CallbackWithPromise<any>;
export type CallbackWithPromise<ReturnType> = Callback<ReturnType> & {
    [kCallbackPromise]?: Promise<ReturnType>;
};
export declare function createPromisifiedCallback<ReturnType>(): CallbackWithPromise<ReturnType>;
export declare function runConcurrentCallbacks<ReturnType>(errorMessage: string, collection: unknown[] | Set<unknown> | Map<unknown, unknown>, operation: (item: any, cb: Callback<ReturnType>) => void, callback: Callback<ReturnType[]>): void;
