import { ProduceAcks } from "../../apis/enumerations.js";
import { compressionsAlgorithms } from "../../protocol/compression.js";
import { messageSchema } from "../../protocol/records.js";
import { ajv, enumErrorMessage } from "../../utils.js";
import { serdeProperties } from "../serde.js";
export const produceOptionsProperties = {
    producerId: { bigint: true },
    producerEpoch: { type: 'number' },
    idempotent: { type: 'boolean' },
    acks: {
        type: 'number',
        enumeration: {
            allowed: Object.values(ProduceAcks),
            errorMessage: enumErrorMessage(ProduceAcks)
        }
    },
    compression: {
        type: 'string',
        enumeration: {
            allowed: Object.keys(compressionsAlgorithms),
            errorMessage: enumErrorMessage(compressionsAlgorithms, true)
        }
    },
    partitioner: { function: true },
    autocreateTopics: { type: 'boolean' },
    repeatOnStaleMetadata: { type: 'boolean' }
};
export const produceOptionsSchema = {
    type: 'object',
    properties: produceOptionsProperties,
    additionalProperties: false
};
export const produceOptionsValidator = ajv.compile(produceOptionsSchema);
export const producerOptionsValidator = ajv.compile({
    type: 'object',
    properties: {
        ...produceOptionsProperties,
        serializers: serdeProperties
    },
    additionalProperties: true
});
export const sendOptionsSchema = {
    type: 'object',
    properties: {
        messages: { type: 'array', items: messageSchema },
        ...produceOptionsProperties
    },
    required: ['messages'],
    additionalProperties: false
};
export const sendOptionsValidator = ajv.compile(sendOptionsSchema);
