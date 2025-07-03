export type Serializer<InputType = unknown> = (data?: InputType) => Buffer | undefined;
export type Deserializer<OutputType = unknown> = (data?: Buffer) => OutputType | undefined;
export type SerializerWithHeaders<InputType = unknown, HeaderKey = unknown, HeaderValue = unknown> = (data?: InputType, headers?: Map<HeaderKey, HeaderValue>) => Buffer | undefined;
export type DeserializerWithHeaders<OutputType = unknown, HeaderKey = unknown, HeaderValue = unknown> = (data?: Buffer, headers?: Map<HeaderKey, HeaderValue>) => OutputType | undefined;
export interface Serializers<Key, Value, HeaderKey, HeaderValue> {
    key: SerializerWithHeaders<Key, HeaderKey, HeaderValue>;
    value: SerializerWithHeaders<Value, HeaderKey, HeaderValue>;
    headerKey: Serializer<HeaderKey>;
    headerValue: Serializer<HeaderValue>;
}
export interface Deserializers<Key, Value, HeaderKey, HeaderValue> {
    key: DeserializerWithHeaders<Key>;
    value: DeserializerWithHeaders<Value>;
    headerKey: Deserializer<HeaderKey>;
    headerValue: Deserializer<HeaderValue>;
}
export declare function stringSerializer(data?: string): Buffer | undefined;
export declare function stringDeserializer(data?: string | Buffer): string | undefined;
export declare function jsonSerializer<T = Record<string, any>>(data?: T): Buffer | undefined;
export declare function jsonDeserializer<T = Record<string, any>>(data?: string | Buffer): T | undefined;
export declare function serializersFrom<T>(serializer: Serializer<T>): Serializers<T, T, T, T>;
export declare function deserializersFrom<T>(deserializer: Deserializer<T>): Deserializers<T, T, T, T>;
export declare const serdeProperties: {
    type: string;
    properties: {
        key: {
            function: boolean;
        };
        value: {
            function: boolean;
        };
        headerKey: {
            function: boolean;
        };
        headerValue: {
            function: boolean;
        };
    };
    additionalProperties: boolean;
};
export declare const stringSerializers: Serializers<string, string, string, string>;
export declare const stringDeserializers: Deserializers<string, string, string, string>;
