import { type CallbackWithPromise } from '../../apis/callbacks.ts';
import { type Callback } from '../../apis/definitions.ts';
import { Base } from '../base/base.ts';
import { type AdminOptions, type CreatedTopic, type CreateTopicsOptions, type DeleteGroupsOptions, type DeleteTopicsOptions, type DescribeGroupsOptions, type Group, type GroupBase, type ListGroupsOptions, type ListTopicsOptions } from './types.ts';
export declare class Admin extends Base<AdminOptions> {
    #private;
    constructor(options: AdminOptions);
    listTopics(options: ListTopicsOptions, callback: Callback<string[]>): void;
    listTopics(options?: ListTopicsOptions): Promise<string[]>;
    createTopics(options: CreateTopicsOptions, callback: Callback<CreatedTopic[]>): void;
    createTopics(options: CreateTopicsOptions): Promise<CreatedTopic[]>;
    deleteTopics(options: DeleteTopicsOptions, callback: CallbackWithPromise<void>): void;
    deleteTopics(options: DeleteTopicsOptions): Promise<void>;
    listGroups(options: ListGroupsOptions, callback: CallbackWithPromise<Map<string, GroupBase>>): void;
    listGroups(options?: ListGroupsOptions): Promise<Map<string, GroupBase>>;
    describeGroups(options: DescribeGroupsOptions, callback: CallbackWithPromise<Map<string, Group>>): void;
    describeGroups(options: DescribeGroupsOptions): Promise<Map<string, Group>>;
    deleteGroups(options: DeleteGroupsOptions, callback: CallbackWithPromise<void>): void;
    deleteGroups(options: DeleteGroupsOptions): Promise<void>;
}
