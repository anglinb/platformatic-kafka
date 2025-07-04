import { UserError } from "../errors.js";
import { EMPTY_BUFFER, INT16_SIZE, INT32_SIZE, INT64_SIZE, INT8_SIZE } from "./definitions.js";
import { BITS_8PLUS_MASK, BITS_8PLUS_MASK_64, int64ZigZagDecode, int64ZigZagEncode, intZigZagDecode, intZigZagEncode, LEAST_SIGNIFICANT_7_BITS, LEAST_SIGNIFICANT_7_BITS_64, MOST_SIGNIFICANT_BIT_FLAG, MOST_SIGNIFICANT_BIT_FLAG_64, sizeOfUnsignedVarInt, sizeOfUnsignedVarInt64 } from "./varint.js";
const instanceIdentifier = Symbol('plt.kafka.dynamicBuffer.instanceIdentifier');
export class DynamicBuffer {
    buffers;
    length;
    #readBuffer; // This is used from the fixed length readers
    [instanceIdentifier];
    static isDynamicBuffer(target) {
        return target?.[instanceIdentifier] === true;
    }
    constructor(buffers) {
        this.buffers = [];
        this.length = 0;
        this.#readBuffer = Buffer.allocUnsafe(8);
        this[instanceIdentifier] = true;
        if (buffers) {
            if (Buffer.isBuffer(buffers)) {
                this.buffers.push(buffers);
                this.length += buffers.length;
            }
            else {
                for (const buffer of buffers) {
                    this.buffers.push(buffer);
                    this.length += buffer.length;
                }
            }
        }
    }
    get buffer() {
        if (this.buffers.length === 0) {
            return EMPTY_BUFFER;
        }
        if (this.buffers.length === 1) {
            return this.buffers[0];
        }
        return Buffer.concat(this.buffers, this.length);
    }
    append(buffer) {
        this.buffers.push(buffer);
        this.length += buffer.length;
        return this;
    }
    prepend(buffer) {
        this.buffers.unshift(buffer);
        this.length += buffer.length;
        return this;
    }
    appendFrom(DynamicBuffer) {
        this.buffers.push(...DynamicBuffer.buffers);
        this.length += DynamicBuffer.length;
        return this;
    }
    prependFrom(DynamicBuffer) {
        this.buffers.unshift(...DynamicBuffer.buffers);
        this.length += DynamicBuffer.length;
        return this;
    }
    subarray(start = 0, end) {
        if (typeof end === 'undefined') {
            end = this.length;
        }
        if (start < 0 || start > this.length || end > this.length) {
            throw new UserError('Out of bounds.');
        }
        if (this.buffers.length === 0) {
            return new DynamicBuffer(EMPTY_BUFFER);
        }
        else if (this.buffers.length === 1) {
            return new DynamicBuffer(this.buffers[0].subarray(start, end));
        }
        let length = end - start;
        let [startBuffer, current] = this.#findInitialBuffer(start);
        start = startBuffer;
        // The slice is in a single buffer
        if (length <= this.buffers[current].length - start) {
            return new DynamicBuffer(this.buffers[current].subarray(start, start + length));
        }
        // Copy all subarrays
        const buffers = [];
        while (length > 0) {
            const currentEnd = Math.min(this.buffers[current].length - start, length);
            buffers.push(this.buffers[current].subarray(start, start + currentEnd));
            length -= currentEnd;
            start = 0;
            current++;
        }
        return new DynamicBuffer(buffers);
    }
    slice(start = 0, end) {
        if (typeof end === 'undefined') {
            end = this.length;
        }
        if (start < 0 || start > this.length || end > this.length) {
            throw new UserError('Out of bounds.');
        }
        if (this.buffers.length === 0) {
            return EMPTY_BUFFER;
        }
        else if (this.buffers.length === 1) {
            return this.buffers[0].slice(start, end);
        }
        let position = 0;
        let length = end - start;
        let [startBuffer, current] = this.#findInitialBuffer(start);
        start = startBuffer;
        // The slice is in a single buffer
        if (length <= this.buffers[current].length - start) {
            return this.buffers[current].slice(start, start + length);
        }
        // Copy all buffers
        const buffer = Buffer.allocUnsafe(length);
        while (length > 0) {
            const currentEnd = Math.min(this.buffers[current].length - start, length);
            this.buffers[current].copy(buffer, position, start, start + currentEnd);
            position += currentEnd;
            length -= currentEnd;
            start = 0;
            current++;
        }
        return buffer;
    }
    clone(deep = false) {
        if (!deep) {
            return new DynamicBuffer(this.buffers);
        }
        const buffers = [];
        for (const buffer of this.buffers) {
            buffers.push(buffer.slice());
        }
        return new DynamicBuffer(buffers);
    }
    consume(offset) {
        if (offset < 0 || offset > this.length) {
            throw new UserError('Out of bounds.');
        }
        if (offset === 0) {
            return this;
        }
        const [start, current] = this.#findInitialBuffer(offset);
        // Remove other arrays
        if (current > 0) {
            this.buffers.splice(0, current);
        }
        // Trim the new first array
        if (start > 0) {
            this.buffers[0] = this.buffers[0].subarray(start);
        }
        // Compute length again
        this.length = 0;
        for (const buffer of this.buffers) {
            this.length += buffer.length;
        }
        return this;
    }
    toString(encoding = 'utf-8', start = 0, end) {
        return this.slice(start, end).toString(encoding);
    }
    get(offset) {
        if (offset < 0 || offset >= this.length) {
            throw new UserError('Out of bounds.');
        }
        const [finalIndex, current] = this.#findInitialBuffer(offset);
        return this.buffers[current][finalIndex];
    }
    readUInt8(offset = 0) {
        if (offset < 0 || offset >= this.length) {
            throw new UserError('Out of bounds.');
        }
        const [finalIndex, current] = this.#findInitialBuffer(offset);
        this.#readBuffer[0] = this.buffers[current][finalIndex];
        return this.#readBuffer.readUInt8(0);
    }
    readUInt16BE(offset = 0) {
        this.#readMultiple(offset, 2);
        return this.#readBuffer.readUInt16BE(0);
    }
    readUInt16LE(offset = 0) {
        this.#readMultiple(offset, 2);
        return this.#readBuffer.readUInt16LE(0);
    }
    readUInt32BE(offset = 0) {
        this.#readMultiple(offset, 4);
        return this.#readBuffer.readUInt32BE(0);
    }
    readUInt32LE(offset = 0) {
        this.#readMultiple(offset, 4);
        return this.#readBuffer.readUInt32LE(0);
    }
    readBigUInt64BE(offset = 0) {
        this.#readMultiple(offset, 8);
        return this.#readBuffer.readBigUInt64BE(0);
    }
    readBigUInt64LE(offset = 0) {
        this.#readMultiple(offset, 8);
        return this.#readBuffer.readBigUInt64LE(0);
    }
    readUnsignedVarInt(offset) {
        let i = 0;
        let byte;
        let value = 0;
        let read = 0;
        if (offset < 0 || offset >= this.length) {
            throw new UserError('Out of bounds.');
        }
        // Find the initial buffer
        let [startOffset, current] = this.#findInitialBuffer(offset);
        do {
            byte = this.buffers[current][startOffset++];
            read++;
            if (startOffset >= this.buffers[current].length) {
                current++;
                startOffset = 0;
            }
            value += (byte & LEAST_SIGNIFICANT_7_BITS) << i;
            i += 7;
        } while (byte >= MOST_SIGNIFICANT_BIT_FLAG);
        return [value, read];
    }
    readUnsignedVarInt64(offset) {
        let i = 0n;
        let byte;
        let value = 0n;
        let read = 0;
        if (offset < 0 || offset >= this.length) {
            throw new UserError('Out of bounds.');
        }
        // Find the initial buffer
        let [startOffset, current] = this.#findInitialBuffer(offset);
        do {
            byte = BigInt(this.buffers[current][startOffset++]);
            read++;
            if (startOffset >= this.buffers[current].length) {
                current++;
                startOffset = 0;
            }
            value += (byte & LEAST_SIGNIFICANT_7_BITS_64) << i;
            i += 7n;
        } while (byte >= MOST_SIGNIFICANT_BIT_FLAG_64);
        return [value, read];
    }
    readInt8(offset = 0) {
        if (offset < 0 || offset >= this.length) {
            throw new UserError('Out of bounds.');
        }
        const [finalIndex, current] = this.#findInitialBuffer(offset);
        this.#readBuffer[0] = this.buffers[current][finalIndex];
        return this.#readBuffer.readInt8(0);
    }
    readInt16BE(offset = 0) {
        this.#readMultiple(offset, INT16_SIZE);
        return this.#readBuffer.readInt16BE(0);
    }
    readInt16LE(offset = 0) {
        this.#readMultiple(offset, INT16_SIZE);
        return this.#readBuffer.readInt16LE(0);
    }
    readInt32BE(offset = 0) {
        this.#readMultiple(offset, INT32_SIZE);
        return this.#readBuffer.readInt32BE(0);
    }
    readInt32LE(offset = 0) {
        this.#readMultiple(offset, INT32_SIZE);
        return this.#readBuffer.readInt32LE(0);
    }
    readBigInt64BE(offset = 0) {
        this.#readMultiple(offset, INT64_SIZE);
        return this.#readBuffer.readBigInt64BE(0);
    }
    readBigInt64LE(offset = 0) {
        this.#readMultiple(offset, INT64_SIZE);
        return this.#readBuffer.readBigInt64LE(0);
    }
    readVarInt(offset) {
        const [value, read] = this.readUnsignedVarInt(offset);
        return [intZigZagDecode(value), read];
    }
    readVarInt64(offset) {
        const [value, read] = this.readUnsignedVarInt64(offset);
        return [int64ZigZagDecode(value), read];
    }
    readFloatBE(offset = 0) {
        this.#readMultiple(offset, INT32_SIZE);
        return this.#readBuffer.readFloatBE(0);
    }
    readFloatLE(offset = 0) {
        this.#readMultiple(offset, INT32_SIZE);
        return this.#readBuffer.readFloatLE(0);
    }
    readDoubleBE(offset = 0) {
        this.#readMultiple(offset, INT64_SIZE);
        return this.#readBuffer.readDoubleBE(0);
    }
    readDoubleLE(offset = 0) {
        this.#readMultiple(offset, INT64_SIZE);
        return this.#readBuffer.readDoubleLE(0);
    }
    writeUInt8(value, append = true) {
        const buffer = Buffer.allocUnsafe(INT8_SIZE);
        buffer.writeUInt8(value);
        if (append) {
            this.append(buffer);
        }
        else {
            this.prepend(buffer);
        }
        return this;
    }
    writeUInt16BE(value, append = true) {
        const buffer = Buffer.allocUnsafe(INT16_SIZE);
        buffer.writeUInt16BE(value);
        if (append) {
            this.append(buffer);
        }
        else {
            this.prepend(buffer);
        }
        return this;
    }
    writeUInt16LE(value, append = true) {
        const buffer = Buffer.allocUnsafe(INT16_SIZE);
        buffer.writeUInt16LE(value);
        if (append) {
            this.append(buffer);
        }
        else {
            this.prepend(buffer);
        }
        return this;
    }
    writeUInt32BE(value, append = true) {
        const buffer = Buffer.allocUnsafe(INT32_SIZE);
        buffer.writeUInt32BE(value);
        if (append) {
            this.append(buffer);
        }
        else {
            this.prepend(buffer);
        }
        return this;
    }
    writeUInt32LE(value, append = true) {
        const buffer = Buffer.allocUnsafe(INT32_SIZE);
        buffer.writeUInt32LE(value);
        if (append) {
            this.append(buffer);
        }
        else {
            this.prepend(buffer);
        }
        return this;
    }
    writeBigUInt64BE(value, append = true) {
        const buffer = Buffer.allocUnsafe(INT64_SIZE);
        buffer.writeBigUInt64BE(value);
        if (append) {
            this.append(buffer);
        }
        else {
            this.prepend(buffer);
        }
        return this;
    }
    writeBigUInt64LE(value, append = true) {
        const buffer = Buffer.allocUnsafe(INT64_SIZE);
        buffer.writeBigUInt64LE(value);
        if (append) {
            this.append(buffer);
        }
        else {
            this.prepend(buffer);
        }
        return this;
    }
    writeUnsignedVarInt(value, append = true) {
        const buffer = Buffer.alloc(sizeOfUnsignedVarInt(value));
        let position = 0;
        while ((value & BITS_8PLUS_MASK) !== 0) {
            buffer.writeUInt8((value & LEAST_SIGNIFICANT_7_BITS) | MOST_SIGNIFICANT_BIT_FLAG, position);
            position++;
            value >>>= 7;
        }
        buffer.writeUInt8(value & LEAST_SIGNIFICANT_7_BITS, position);
        if (append) {
            this.append(buffer);
        }
        else {
            this.prepend(buffer);
        }
    }
    writeUnsignedVarInt64(value, append = true) {
        const buffer = Buffer.alloc(sizeOfUnsignedVarInt64(value));
        let position = 0;
        while ((value & BITS_8PLUS_MASK_64) !== 0n) {
            buffer.writeUInt8(Number((value & LEAST_SIGNIFICANT_7_BITS_64) | MOST_SIGNIFICANT_BIT_FLAG_64), position);
            position++;
            value >>= 7n;
        }
        buffer.writeUInt8(Number(value & LEAST_SIGNIFICANT_7_BITS_64), position);
        if (append) {
            this.append(buffer);
        }
        else {
            this.prepend(buffer);
        }
    }
    writeInt8(value, append = true) {
        const buffer = Buffer.allocUnsafe(INT8_SIZE);
        buffer.writeInt8(value);
        if (append) {
            this.append(buffer);
        }
        else {
            this.prepend(buffer);
        }
        return this;
    }
    writeInt16BE(value, append = true) {
        const buffer = Buffer.allocUnsafe(INT16_SIZE);
        buffer.writeInt16BE(value);
        if (append) {
            this.append(buffer);
        }
        else {
            this.prepend(buffer);
        }
        return this;
    }
    writeInt16LE(value, append = true) {
        const buffer = Buffer.allocUnsafe(INT16_SIZE);
        buffer.writeInt16LE(value);
        if (append) {
            this.append(buffer);
        }
        else {
            this.prepend(buffer);
        }
        return this;
    }
    writeInt32BE(value, append = true) {
        const buffer = Buffer.allocUnsafe(INT32_SIZE);
        buffer.writeInt32BE(value);
        if (append) {
            this.append(buffer);
        }
        else {
            this.prepend(buffer);
        }
        return this;
    }
    writeInt32LE(value, append = true) {
        const buffer = Buffer.allocUnsafe(INT32_SIZE);
        buffer.writeInt32LE(value);
        if (append) {
            this.append(buffer);
        }
        else {
            this.prepend(buffer);
        }
        return this;
    }
    writeBigInt64BE(value, append = true) {
        const buffer = Buffer.allocUnsafe(INT64_SIZE);
        buffer.writeBigInt64BE(value);
        if (append) {
            this.append(buffer);
        }
        else {
            this.prepend(buffer);
        }
        return this;
    }
    writeBigInt64LE(value, append = true) {
        const buffer = Buffer.allocUnsafe(INT64_SIZE);
        buffer.writeBigInt64LE(value);
        if (append) {
            this.append(buffer);
        }
        else {
            this.prepend(buffer);
        }
        return this;
    }
    writeVarInt(value, append = true) {
        this.writeUnsignedVarInt(intZigZagEncode(value), append);
    }
    writeVarInt64(value, append = true) {
        this.writeUnsignedVarInt64(int64ZigZagEncode(value), append);
    }
    writeFloatBE(value, append = true) {
        const buffer = Buffer.allocUnsafe(INT32_SIZE);
        buffer.writeFloatBE(value);
        if (append) {
            this.append(buffer);
        }
        else {
            this.prepend(buffer);
        }
        return this;
    }
    writeFloatLE(value, append = true) {
        const buffer = Buffer.allocUnsafe(INT32_SIZE);
        buffer.writeFloatLE(value);
        if (append) {
            this.append(buffer);
        }
        else {
            this.prepend(buffer);
        }
        return this;
    }
    writeDoubleBE(value, append = true) {
        const buffer = Buffer.allocUnsafe(INT64_SIZE);
        buffer.writeDoubleBE(value);
        if (append) {
            this.append(buffer);
        }
        else {
            this.prepend(buffer);
        }
        return this;
    }
    writeDoubleLE(value, append = true) {
        const buffer = Buffer.allocUnsafe(INT64_SIZE);
        buffer.writeDoubleLE(value);
        if (append) {
            this.append(buffer);
        }
        else {
            this.prepend(buffer);
        }
        return this;
    }
    #findInitialBuffer(start) {
        let current = 0;
        // Find the initial buffer
        while (start > 0 && start >= this.buffers[current].length) {
            start -= this.buffers[current].length;
            current++;
        }
        return [start, current];
    }
    #readMultiple(index, length) {
        if (index < 0 || index + length > this.length) {
            throw new UserError('Out of bounds.');
        }
        let [startOffset, current] = this.#findInitialBuffer(index);
        for (let i = 0; i < length; i++) {
            this.#readBuffer[i] = this.buffers[current][startOffset++];
            if (startOffset === this.buffers[current].length) {
                current++;
                startOffset = 0;
            }
        }
    }
}
