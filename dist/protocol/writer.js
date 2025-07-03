import { humanize } from "../utils.js";
import { EMPTY_UUID } from "./definitions.js";
import { DynamicBuffer } from "./dynamic-buffer.js";
const instanceIdentifier = Symbol('plt.kafka.writer.instanceIdentifier');
export class Writer {
    context;
    #buffer;
    [instanceIdentifier];
    static isWriter(target) {
        return target?.[instanceIdentifier] === true;
    }
    static create() {
        return new Writer(new DynamicBuffer());
    }
    constructor(bl) {
        this.#buffer = bl;
        this.context = {};
        this[instanceIdentifier] = true;
    }
    get buffer() {
        return this.#buffer.buffer;
    }
    get buffers() {
        return this.#buffer.buffers;
    }
    get dynamicBuffer() {
        return this.#buffer;
    }
    get length() {
        return this.#buffer.length;
    }
    inspect() {
        return this.buffers.map((buffer, i) => humanize(`Buffer ${i}`, buffer)).join('\n');
    }
    append(buffer) {
        this.#buffer.append(buffer);
        return this;
    }
    prepend(buffer) {
        this.#buffer.prepend(buffer);
        return this;
    }
    appendFrom(buffer) {
        this.#buffer.appendFrom(buffer?.dynamicBuffer ?? buffer);
        return this;
    }
    prependFrom(buffer) {
        this.#buffer.prependFrom(buffer?.dynamicBuffer ?? buffer);
        return this;
    }
    appendUnsignedInt8(value, append = true) {
        this.#buffer.writeUInt8(value, append);
        return this;
    }
    appendUnsignedInt16(value, append = true) {
        this.#buffer.writeUInt16BE(value, append);
        return this;
    }
    appendUnsignedInt32(value, append = true) {
        this.#buffer.writeUInt32BE(value, append);
        return this;
    }
    appendUnsignedInt64(value, append = true) {
        this.#buffer.writeBigUInt64BE(value, append);
        return this;
    }
    appendUnsignedVarInt(value, append = true) {
        this.#buffer.writeUnsignedVarInt(value, append);
        return this;
    }
    appendUnsignedVarInt64(value, append = true) {
        this.#buffer.writeUnsignedVarInt64(value, append);
        return this;
    }
    appendInt8(value, append = true) {
        this.#buffer.writeInt8(value, append);
        return this;
    }
    appendInt16(value, append = true) {
        this.#buffer.writeInt16BE(value, append);
        return this;
    }
    appendInt32(value, append = true) {
        this.#buffer.writeInt32BE(value, append);
        return this;
    }
    appendInt64(value, append = true) {
        this.#buffer.writeBigInt64BE(value, append);
        return this;
    }
    // In Kafka float is actually a double
    appendFloat64(value, append = true) {
        this.#buffer.writeDoubleBE(value, append);
        return this;
    }
    appendVarInt(value, append = true) {
        this.#buffer.writeVarInt(value, append);
        return this;
    }
    appendVarInt64(value, append = true) {
        this.#buffer.writeVarInt64(value, append);
        return this;
    }
    appendBoolean(value) {
        return this.appendUnsignedInt8(value ? 1 : 0);
    }
    appendString(value, compact = true, encoding = 'utf-8') {
        if (value == null) {
            return compact ? this.appendUnsignedVarInt(0) : this.appendInt16(-1);
        }
        const buffer = Buffer.from(value, encoding);
        if (compact) {
            this.appendUnsignedVarInt(buffer.length + 1);
        }
        else {
            this.appendInt16(buffer.length);
        }
        if (buffer.length) {
            this.#buffer.append(buffer);
        }
        return this;
    }
    appendUUID(value) {
        if (value == null) {
            return this.append(EMPTY_UUID);
        }
        const buffer = Buffer.from(value.replaceAll('-', ''), 'hex');
        this.#buffer.append(buffer);
        return this;
    }
    appendBytes(value, compact = true) {
        if (value == null) {
            return compact ? this.appendUnsignedVarInt(0) : this.appendInt32(-1);
        }
        if (compact) {
            this.appendUnsignedVarInt(value.length + 1);
        }
        else {
            this.appendInt32(value.length);
        }
        this.#buffer.append(value);
        return this;
    }
    // Note that this does not follow the wire protocol specification and thus the length is not +1ed
    appendVarIntBytes(value) {
        if (value == null) {
            return this.appendVarInt(0);
        }
        this.appendVarInt(value.length);
        this.#buffer.append(value);
        return this;
    }
    appendArray(value, entryWriter, compact = true, appendTrailingTaggedFields = true) {
        if (value == null) {
            return compact ? this.appendUnsignedVarInt(0) : this.appendInt32(0);
        }
        const length = value.length;
        if (compact) {
            this.appendUnsignedVarInt(length + 1);
        }
        else {
            this.appendInt32(length);
        }
        for (let i = 0; i < length; i++) {
            entryWriter(this, value[i], i);
            if (appendTrailingTaggedFields) {
                this.appendTaggedFields();
            }
        }
        return this;
    }
    appendMap(value, entryWriter, compact = true, appendTrailingTaggedFields = true) {
        if (value == null) {
            return compact ? this.appendUnsignedVarInt(0) : this.appendInt32(0);
        }
        const length = value.size;
        if (compact) {
            this.appendUnsignedVarInt(length + 1);
        }
        else {
            this.appendInt32(length);
        }
        let i = 0;
        for (const entry of value) {
            entryWriter(this, entry, i++);
            if (appendTrailingTaggedFields) {
                this.appendTaggedFields();
            }
        }
        return this;
    }
    appendVarIntArray(value, entryWriter) {
        if (value == null) {
            return this.appendVarInt(0);
        }
        this.appendVarInt(value.length);
        for (let i = 0; i < value.length; i++) {
            entryWriter(this, value[i], i);
        }
        return this;
    }
    appendVarIntMap(value, entryWriter) {
        if (value == null) {
            return this.appendVarInt(0);
        }
        this.appendVarInt(value.size);
        let i = 0;
        for (const entry of value) {
            entryWriter(this, entry, i++);
        }
        return this;
    }
    // TODO(ShogunPanda): Tagged fields are not supported yet
    appendTaggedFields(_ = []) {
        return this.appendInt8(0);
    }
    prependLength() {
        return this.appendInt32(this.length, false);
    }
    prependVarIntLength() {
        return this.appendVarInt(this.length, false);
    }
}
