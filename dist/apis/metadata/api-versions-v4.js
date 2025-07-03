import { ResponseError } from "../../errors.js";
import { protocolAPIsById } from "../../protocol/apis.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  ApiVersions Request (Version: 4) => client_software_name client_software_version TAG_BUFFER
    client_software_name => COMPACT_STRING
    client_software_version => COMPACT_STRING
*/
export function createRequest(clientSoftwareName, clientSoftwareVersion) {
    return Writer.create().appendString(clientSoftwareName).appendString(clientSoftwareVersion).appendTaggedFields();
}
/*
  ApiVersions Response (Version: 4) => error_code [api_keys] throttle_time_ms TAG_BUFFER
    error_code => INT16
    api_keys => api_key min_version max_version TAG_BUFFER
      api_key => INT16
      min_version => INT16
      max_version => INT16
    throttle_time_ms => INT32
*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const response = {
        errorCode: reader.readInt16(),
        apiKeys: reader.readArray(r => {
            const apiKey = r.readInt16();
            return {
                apiKey,
                name: protocolAPIsById[apiKey],
                minVersion: r.readInt16(),
                maxVersion: r.readInt16()
            };
        }),
        throttleTimeMs: reader.readInt32()
    };
    if (response.errorCode !== 0) {
        throw new ResponseError(apiKey, apiVersion, { '': response.errorCode }, response);
    }
    return response;
}
export const api = createAPI(18, 4, createRequest, parseResponse, true, false);
