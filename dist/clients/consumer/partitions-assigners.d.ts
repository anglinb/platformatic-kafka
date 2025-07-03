import { type ClusterMetadata } from '../base/types.ts';
import { type ExtendedGroupProtocolSubscription, type GroupPartitionsAssignments } from './types.ts';
export declare function roundRobinAssigner(_current: string, members: Map<string, ExtendedGroupProtocolSubscription>, topics: Set<string>, metadata: ClusterMetadata): GroupPartitionsAssignments[];
