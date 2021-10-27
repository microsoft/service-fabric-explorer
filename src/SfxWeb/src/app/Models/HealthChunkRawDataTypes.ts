// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

export enum HealthStateFilterFlags {
    Default = 0x0,  // Matches any healthState.
    None = 0x1,     // A filter that doesn't match any HealthStates.
    Ok = 0x2,
    Warning = 0x4,
    Error = 0x8,
    All = 0xFFFF    // Matches any healthState.
}

export interface IHealthStateChunk {
    HealthState: string;
}

export interface IHealthStateChunkList<T> {
    TotalCount: number;
    Items: T[];
}

export interface IClusterHealthChunk extends IHealthStateChunk {
    NodeHealthStateChunks: IHealthStateChunkList<INodeHealthStateChunk>;
    ApplicationHealthStateChunks: IHealthStateChunkList<IApplicationHealthStateChunk>;

    // Extracted from ApplicationHealthStateChunks as standalone health chunk to adapt to SFX tree structures
    SystemApplicationHealthStateChunk: IApplicationHealthStateChunk;
}

export interface INodeHealthStateChunk extends IHealthStateChunk {
    NodeName: string;

    // Added by SFX to adapt to tree structure
    DeployedApplicationHealthStateChunks: IHealthStateChunkList<IDeployedApplicationHealthStateChunk>;
}

export interface IApplicationHealthStateChunk extends IHealthStateChunk {
    ApplicationName: string;    // As Uri
    ApplicationTypeName: string;
    ServiceHealthStateChunks: IHealthStateChunkList<IServiceHealthStateChunk>;
    DeployedApplicationHealthStateChunks: IHealthStateChunkList<IDeployedApplicationHealthStateChunk>;
}

export interface IDeployedApplicationHealthStateChunk extends IHealthStateChunk {
    NodeName: string;
    DeployedServicePackageHealthStateChunks: IHealthStateChunkList<IDeployedServicePackageHealthStateChunk>;

    // Added by SFX to adapt to tree structure
    ApplicationName: string;
}

export interface IDeployedServicePackageHealthStateChunk extends IHealthStateChunk {
    ServiceManifestName: string;
    ServicePackageActivationId: string;
}

export interface IServiceHealthStateChunk extends IHealthStateChunk {
    ServiceName: string;
    PartitionHealthStateChunks: IHealthStateChunkList<IPartitionHealthStateChunk>;
}

export interface IPartitionHealthStateChunk extends IHealthStateChunk {
    PartitionId: string;
    ReplicaHealthStateChunks: IHealthStateChunkList<IReplicaHealthStateChunk>;
}

export interface IReplicaHealthStateChunk extends IHealthStateChunk {
    ReplicaOrInstanceId: string;
}

// The following types are used when sending the POST request to the Cluster.
// The API Also supports passing in Cluster and Application HealthPolicies,
// SFX currently does not use them.

export interface IClusterHealthChunkQueryDescription {
    // The platform allows for specifying a ClusterHealthPolicy and ApplicationHealthPolicies, SFX currently does not use them.
    ApplicationFilters: IApplicationHealthStateFilter[];
    NodeFilters: INodeHealthStateFilter[];
}

export interface IHealthStateFilter {
    HealthStateFilter?: HealthStateFilterFlags;
}

export interface IApplicationHealthStateFilter extends IHealthStateFilter {
    ApplicationNameFilter?: string;   // If not specified, represents the default filter.
    ApplicationTypeNameFilter?: string;
    ServiceFilters?: IServiceHealthStateFilter[];
    DeployedApplicationFilters?: IDeployedApplicationHealthStateFilter[];
}

export interface IServiceHealthStateFilter extends IHealthStateFilter {
    ServiceNameFilter?: string; // If null, default filter.
    PartitionFilters?: IPartitionHealthStateFilter[];
}

export interface IPartitionHealthStateFilter extends IHealthStateFilter {
    PartitionIdFilter?: string; // This is a guid.
    ReplicaFilters?: IReplicaHealthStateFilter[];
}

export interface IReplicaHealthStateFilter extends IHealthStateFilter {
    ReplicaOrInstanceIdFilter?: string; // If null, default filter.
}

export interface INodeHealthStateFilter extends IHealthStateFilter {
    NodeNameFilter?: string; // If empty, default filter.
}

export interface IDeployedApplicationHealthStateFilter extends IHealthStateFilter {
    NodeNameFilter?: string; // If empty, default filter.
    DeployedServicePackageFilters?: IDeployedServicePackageHealthStateFilter[];
}

export interface IDeployedServicePackageHealthStateFilter extends IHealthStateFilter {
    ServiceManifestNameFilter?: string; // If empty, default filter.
}
