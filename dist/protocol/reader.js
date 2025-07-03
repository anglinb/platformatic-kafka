import { EMPTY_BUFFER, INT16_SIZE, INT32_SIZE, INT64_SIZE, INT8_SIZE, UUID_SIZE } from "./definitions.js";
import { DynamicBuffer } from "./dynamic-buffer.js";
import { Writer } from "./writer.js";
const instanceIdentifier = Symbol('plt.kafka.reader.instanceIdentifier');
export class Reader {
    buffer;
    position;
    [instanceIdentifier];
    static isReader(target) {
        return target?.[instanceIdentifier] === true;
    }
    static from(buffer) {
        if (Writer.isWriter(buffer)) {
            return new Reader(buffer.dynamicBuffer);
        }
        else if (Buffer.isBuffer(buffer)) {
            buffer = new DynamicBuffer(buffer);
        }
        return new Reader(buffer);
    }
    constructor(buffer) {
        this.buffer = buffer;
        this.position = 0;
        this[instanceIdentifier] = true;
    }
    reset(buffer) {
        if (buffer) {
            if (Buffer.isBuffer(buffer)) {
                buffer = new DynamicBuffer(buffer);
            }
            this.buffer = buffer;
        }
        this.position = 0;
    }
    inspect() {
        return this.buffer
            .subarray(this.position)
            .toString('hex')
            .replaceAll(/(.{4})/g, '$1 ')
            .trim();
    }
    skip(length) {
        this.position += length;
        return this;
    }
    peekUnsignedInt8() {
        return this.buffer.readUInt8(this.position);
    }
    peekUnsignedInt16() {
        return this.buffer.readUInt16BE(this.position);
    }
    peekUnsignedInt32() {
        return this.buffer.readUInt32BE(this.position);
    }
    peekUnsignedInt64() {
        return this.buffer.readBigUInt64BE(this.position);
    }
    peekUnsignedVarInt() {
        return this.buffer.readUnsignedVarInt(this.position)[0];
    }
    peekUnsignedVarInt64() {
        return this.buffer.readUnsignedVarInt64(this.position)[0];
    }
    peekInt8() {
        return this.buffer.readInt8(this.position);
    }
    peekInt16() {
        return this.buffer.readInt16BE(this.position);
    }
    peekInt32() {
        return this.buffer.readInt32BE(this.position);
    }
    peekInt64() {
        return this.buffer.readBigInt64BE(this.position);
    }
    peekFloat64() {
        return this.buffer.readDoubleBE(this.position);
    }
    peekVarInt() {
        return this.buffer.readVarInt(this.position)[0];
    }
    peekVarInt64() {
        return this.buffer.readVarInt64(this.position)[0];
    }
    peekBoolean() {
        return this.buffer.readInt8(this.position) === 1;
    }
    peekUUID() {
        return this.buffer.toString('hex', this.position, this.position + UUID_SIZE);
    }
    readUnsignedInt8() {
        const value = this.peekUnsignedInt8();
        this.position += INT8_SIZE;
        return value;
    }
    readUnsignedInt16() {
        const value = this.peekUnsignedInt16();
        this.position += INT16_SIZE;
        return value;
    }
    readUnsignedInt32() {
        const value = this.peekUnsignedInt32();
        this.position += INT32_SIZE;
        return value;
    }
    readUnsignedInt64() {
        const value = this.peekUnsignedInt64();
        this.position += INT64_SIZE;
        return value;
    }
    readUnsignedVarInt() {
        const [value, read] = this.buffer.readUnsignedVarInt(this.position);
        this.position += read;
        return value;
    }
    readUnsignedVarInt64() {
        const [value, read] = this.buffer.readUnsignedVarInt64(this.position);
        this.position += read;
        return value;
    }
    readInt8() {
        const value = this.peekInt8();
        this.position += INT8_SIZE;
        return value;
    }
    readInt16() {
        const value = this.peekInt16();
        this.position += INT16_SIZE;
        return value;
    }
    readInt32() {
        const value = this.peekInt32();
        this.position += INT32_SIZE;
        return value;
    }
    readInt64() {
        const value = this.peekInt64();
        this.position += INT64_SIZE;
        return value;
    }
    readFloat64() {
        const value = this.peekFloat64();
        this.position += INT64_SIZE;
        return value;
    }
    readVarInt() {
        const [value, read] = this.buffer.readVarInt(this.position);
        this.position += read;
        return value;
    }
    readVarInt64() {
        const [value, read] = this.buffer.readVarInt64(this.position);
        this.position += read;
        return value;
    }
    readBoolean() {
        const value = this.peekUnsignedInt8();
        this.position += INT8_SIZE;
        return value === 1;
    }
    readNullableString(compact = true, encoding = 'utf-8') {
        let length;
        if (compact) {
            length = this.readUnsignedVarInt();
            if (length === 0) {
                return null;
            }
            length--;
        }
        else {
            length = this.readInt16();
            if (length === -1) {
                return null;
            }
        }
        const value = this.buffer.toString(encoding, this.position, this.position + length);
        this.position += length;
        return value;
    }
    readString(compact = true, encoding = 'utf-8') {
        return this.readNullableString(compact, encoding) || '';
    }
    readUUID() {
        const value = this.peekUUID();
        this.position += UUID_SIZE;
        return value.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
    }
    readNullableBytes(compact = true) {
        let length;
        if (compact) {
            length = this.readUnsignedVarInt();
            if (length === 0) {
                return null;
            }
            length--;
        }
        else {
            length = this.readInt32();
            if (length === -1) {
                return null;
            }
        }
        const value = this.buffer.slice(this.position, this.position + length);
        this.position += length;
        return value;
    }
    readBytes(compact = true) {
        return this.readNullableBytes(compact) || EMPTY_BUFFER;
    }
    readVarIntBytes() {
        let length = this.readVarInt();
        if (length === -1) {
            length = 0;
        }
        const value = this.buffer.slice(this.position, this.position + length);
        this.position += length;
        return value;
    }
    readNullableArray(reader, compact = true, discardTrailingTaggedFields = true) {
        let length;
        if (compact) {
            length = this.readUnsignedVarInt();
            if (length === 0) {
                return null;
            }
            length--;
        }
        else {
            length = this.readInt32();
            if (length === -1) {
                return null;
            }
        }
        const value = [];
        for (let i = 0; i < length; i++) {
            value.push(reader(this, i));
            if (discardTrailingTaggedFields) {
                this.readTaggedFields();
            }
        }
        return value;
    }
    readNullableMap(reader, compact = true, discardTrailingTaggedFields = true) {
        let length;
        if (compact) {
            length = this.readUnsignedVarInt();
            if (length === 0) {
                return null;
            }
            length--;
        }
        else {
            length = this.readInt32();
            if (length === -1) {
                return null;
            }
        }
        const map = new Map();
        for (let i = 0; i < length; i++) {
            const [key, value] = reader(this, i);
            map.set(key, value);
            if (discardTrailingTaggedFields) {
                this.readTaggedFields();
            }
        }
        return map;
    }
    readArray(reader, compact = true, discardTrailingTaggedFields = true) {
        return this.readNullableArray(reader, compact, discardTrailingTaggedFields) || [];
    }
    readMap(reader, compact = true, discardTrailingTaggedFields = true) {
        return this.readNullableMap(reader, compact, discardTrailingTaggedFields) ?? new Map();
    }
    readVarIntArray(reader) {
        const length = this.readVarInt();
        const value = [];
        for (let i = 0; i < length; i++) {
            value.push(reader(this, i));
        }
        return value;
    }
    readVarIntMap(reader) {
        const length = this.readVarInt();
        const map = new Map();
        for (let i = 0; i < length; i++) {
            const [key, value] = reader(this, i);
            map.set(key, value);
        }
        return map;
    }
    // TODO(ShogunPanda): Tagged fields are not supported yet
    readTaggedFields() {
        const length = this.readVarInt();
        if (length > 0) {
            this.skip(length);
        }
    }
}
