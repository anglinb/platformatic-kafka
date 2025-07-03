import { Ajv2020 } from 'ajv/dist/2020.js';
import debug from 'debug';
import { inspect } from 'node:util';
export { setTimeout as sleep } from 'node:timers/promises';
export const ajv = new Ajv2020({ allErrors: true, coerceTypes: false, strict: true });
export const loggers = {
    protocol: debug('plt:kafka:protocol'),
    client: debug('plt:kafka:client'),
    producer: debug('plt:kafka:producer'),
    consumer: debug('plt:kafka:consumer'),
    'consumer:heartbeat': debug('plt:kafka:consumer:heartbeat'),
    admin: debug('plt:kafka:admin')
};
let debugDumpLogger = console.error;
ajv.addKeyword({
    keyword: 'bigint',
    validate(_, x) {
        return typeof x === 'bigint';
    },
    error: {
        message: 'must be bigint'
    }
});
ajv.addKeyword({
    keyword: 'map',
    validate(_, x) {
        return x instanceof Map;
    },
    error: {
        message: 'must be Map'
    }
});
ajv.addKeyword({
    keyword: 'function',
    validate(_, x) {
        return typeof x === 'function';
    },
    error: {
        message: 'must be function'
    }
});
ajv.addKeyword({
    keyword: 'buffer',
    validate(_, x) {
        return Buffer.isBuffer(x);
    },
    error: {
        message: 'must be Buffer'
    }
});
ajv.addKeyword({
    keyword: 'gteProperty',
    validate(property, current, _, context) {
        const root = context?.parentData;
        return current >= root[property];
    },
    error: {
        message({ schema }) {
            return `must be greater than or equal to $dataVar$/${schema}`;
        }
    }
});
ajv.addKeyword({
    keyword: 'lteProperty',
    validate(property, current, _, context) {
        const root = context?.parentData;
        return current < root[property];
    },
    error: {
        message({ schema }) {
            return `must be less than or equal to $dataVar$/${schema}`;
        }
    }
});
ajv.addKeyword({
    keyword: 'enumeration', // This mimics the enum keyword but defines a custom error message
    validate(property, current) {
        return property.allowed.includes(current);
    },
    error: {
        message({ schema }) {
            return schema.errorMessage;
        }
    }
});
export class NumericMap extends Map {
    getWithDefault(key, fallback) {
        return this.get(key) ?? fallback;
    }
    preIncrement(key, value, fallback) {
        let existing = this.getWithDefault(key, fallback);
        existing += value;
        this.set(key, existing);
        return existing;
    }
    postIncrement(key, value, fallback) {
        const existing = this.getWithDefault(key, fallback);
        this.set(key, existing + value);
        return existing;
    }
}
export function niceJoin(array, lastSeparator = ' and ', separator = ', ') {
    switch (array.length) {
        case 0:
            return '';
        case 1:
            return array[0];
        case 2:
            return array.join(lastSeparator);
        default:
            return array.slice(0, -1).join(separator) + lastSeparator + array.at(-1);
    }
}
export function listErrorMessage(type) {
    return `should be one of ${niceJoin(type, ' or ')}`;
}
export function enumErrorMessage(type, keysOnly = false) {
    if (keysOnly) {
        return `should be one of ${niceJoin(Object.keys(type), ' or ')}`;
    }
    return `should be one of ${niceJoin(Object.entries(type).map(([k, v]) => `${v} (${k})`), ' or ')}`;
}
export function groupByProperty(entries, property) {
    const grouped = new Map();
    const result = [];
    for (const entry of entries) {
        const value = entry[property];
        let values = grouped.get(value);
        if (!values) {
            values = [];
            grouped.set(value, values);
            result.push([value, values]);
        }
        values.push(entry);
    }
    return result;
}
export function humanize(label, buffer) {
    const formatted = buffer
        .toString('hex')
        .replaceAll(/(.{4})/g, '$1 ')
        .trim();
    return `${label} (${buffer.length} bytes): ${formatted}`;
}
export function setDebugDumpLogger(logger) {
    debugDumpLogger = logger;
}
export function debugDump(...values) {
    debugDumpLogger(new Date().toISOString(), ...values.map(v => (typeof v === 'string' ? v : inspect(v, false, 10))));
}
