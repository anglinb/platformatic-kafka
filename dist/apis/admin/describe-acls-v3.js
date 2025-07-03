import { ResponseError } from "../../errors.js";
import { Writer } from "../../protocol/writer.js";
import { createAPI } from "../definitions.js";
/*
  DescribeAcls Request (Version: 3) => resource_type_filter resource_name_filter pattern_type_filter principal_filter host_filter operation permission_type TAG_BUFFER
    resource_type_filter => INT8
    resource_name_filter => COMPACT_NULLABLE_STRING
    pattern_type_filter => INT8
    principal_filter => COMPACT_NULLABLE_STRING
    host_filter => COMPACT_NULLABLE_STRING
    operation => INT8
    permission_type => INT8
*/
export function createRequest(resourceTypeFilter, resourceNameFilter, patternTypeFilter, principalFilter, hostFilter, operation, permissionType) {
    return Writer.create()
        .appendInt8(resourceTypeFilter)
        .appendString(resourceNameFilter)
        .appendInt8(patternTypeFilter)
        .appendString(principalFilter)
        .appendString(hostFilter)
        .appendInt8(operation)
        .appendInt8(permissionType)
        .appendTaggedFields();
}
/*
DescribeAcls Response (Version: 3) => throttle_time_ms error_code error_message [resources] TAG_BUFFER
  throttle_time_ms => INT32
  error_code => INT16
  error_message => COMPACT_NULLABLE_STRING
  resources => resource_type resource_name pattern_type [acls] TAG_BUFFER
    resource_type => INT8
    resource_name => COMPACT_STRING
    pattern_type => INT8
    acls => principal host operation permission_type TAG_BUFFER
      principal => COMPACT_STRING
      host => COMPACT_STRING
      operation => INT8
      permission_type => INT8
*/
export function parseResponse(_correlationId, apiKey, apiVersion, reader) {
    const response = {
        throttleTimeMs: reader.readInt32(),
        errorCode: reader.readInt16(),
        errorMessage: reader.readNullableString(),
        resources: reader.readArray(r => {
            return {
                resourceType: r.readInt8(),
                resourceName: r.readString(),
                patternType: r.readInt8(),
                acls: r.readArray(r => {
                    return {
                        principal: r.readString(),
                        host: r.readString(),
                        operation: r.readInt8(),
                        permissionType: r.readInt8()
                    };
                })
            };
        })
    };
    if (response.errorCode) {
        throw new ResponseError(apiKey, apiVersion, { '': response.errorCode }, response);
    }
    return response;
}
export const api = createAPI(29, 3, createRequest, parseResponse);
