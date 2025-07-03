import { type CallbackWithPromise } from '../../apis/callbacks.ts';
import { Base } from '../base/base.ts';
import { type ProduceOptions, type ProduceResult, type ProducerInfo, type ProducerOptions, type SendOptions } from './types.ts';
export declare function noopSerializer(data?: Buffer): Buffer | undefined;
export declare class Producer<Key = Buffer, Value = Buffer, HeaderKey = Buffer, HeaderValue = Buffer> extends Base<ProducerOptions<Key, Value, HeaderKey, HeaderValue>> {
    #private;
    constructor(options: ProducerOptions<Key, Value, HeaderKey, HeaderValue>);
    get producerId(): bigint | undefined;
    get producerEpoch(): number | undefined;
    close(callback: CallbackWithPromise<void>): void;
    close(): Promise<void>;
    initIdempotentProducer(options: ProduceOptions<Key, Value, HeaderKey, HeaderValue>, callback: CallbackWithPromise<ProducerInfo>): void;
    initIdempotentProducer(options: ProduceOptions<Key, Value, HeaderKey, HeaderValue>): Promise<ProducerInfo>;
    send(options: SendOptions<Key, Value, HeaderKey, HeaderValue>, callback: CallbackWithPromise<ProduceResult>): void;
    send(options: SendOptions<Key, Value, HeaderKey, HeaderValue>): Promise<ProduceResult>;
}
