import { Ajv2020 } from 'ajv/dist/2020.js';
import debug from 'debug';
import { type DynamicBuffer } from './protocol/dynamic-buffer.ts';
export interface EnumerationDefinition<T> {
    allowed: T[];
    errorMessage?: string;
}
export type KeywordSchema<T> = {
    schema: T;
};
export interface DataValidationContext {
    parentData: {
        [k: string | number]: any;
    };
}
export type DebugDumpLogger = (...args: any[]) => void;
export { setTimeout as sleep } from 'node:timers/promises';
export declare const ajv: Ajv2020;
export declare const loggers: Record<string, debug.Debugger>;
export declare class NumericMap extends Map<string, number> {
    getWithDefault(key: string, fallback: number): number;
    preIncrement(key: string, value: number, fallback: number): number;
    postIncrement(key: string, value: number, fallback: number): number;
}
export declare function niceJoin(array: string[], lastSeparator?: string, separator?: string): string;
export declare function listErrorMessage(type: string[]): string;
export declare function enumErrorMessage(type: Record<string, unknown>, keysOnly?: boolean): string;
export declare function groupByProperty<Key, Value>(entries: Value[], property: keyof Value): [Key, Value[]][];
export declare function humanize(label: string, buffer: Buffer | DynamicBuffer): string;
export declare function setDebugDumpLogger(logger: DebugDumpLogger): void;
export declare function debugDump(...values: unknown[]): void;
