import { 
    IRawNode, 
    IRawService, 
    IRawApplication, 
    IRawPartition, 
    IRawReplicaOnPartition,
    IRawHealthEvent,
    IRawId,
    IRawNodeDeactivationInfo,
    IRawPartitionInformation,
    IRawServiceDescription
} from '../Models/RawDataTypes';

// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

/**
 * Test fixture factories for creating mock data objects.
 * These factories provide reusable, configurable test data for unit tests.
 * 
 * Usage:
 * ```typescript
 * const mockNode = createMockNode({ Name: 'MyNode', NodeStatus: 'Up' });
 * const mockService = createMockService({ Name: 'fabric:/MyApp/MyService' });
 * ```
 */

/**
 * Creates a mock IRawNode with sensible defaults.
 * Override any properties by passing them in the overrides parameter.
 * 
 * @param overrides - Partial IRawNode to override default values
 * @returns A complete mock IRawNode object
 * 
 * @example
 * const node = createMockNode({ Name: 'Node1', NodeStatus: 'Up' });
 */
export function createMockNode(overrides: Partial<IRawNode> = {}): IRawNode {
    const defaultId: IRawId = {
        Id: overrides.Id?.Id || '12345'
    };

    const defaultDeactivationInfo: IRawNodeDeactivationInfo = {
        NodeDeactivationIntent: 'None',
        NodeDeactivationStatus: 'None',
        NodeDeactivationTask: [],
        PendingSafetyChecks: []
    };

    return {
        Name: 'Node_0',
        IpAddressOrFQDN: '10.0.0.1',
        Type: 'NodeType0',
        CodeVersion: '7.0.0.0',
        ConfigVersion: '1.0.0',
        NodeStatus: 'Up',
        NodeUpTimeInSeconds: '3600',
        HealthState: 'Ok',
        IsSeedNode: true,
        UpgradeDomain: 'UD0',
        FaultDomain: 'fd:/0',
        Id: defaultId,
        InstanceId: '1234567890',
        NodeDeactivationInfo: defaultDeactivationInfo,
        IsStopped: false,
        NodeDownTimeInSeconds: '0',
        NodeUpAt: new Date().toISOString(),
        NodeDownAt: '',
        NodeTags: [],
        ...overrides,
        // Ensure nested objects are properly merged
        Id: overrides.Id ? { ...defaultId, ...overrides.Id } : defaultId,
        NodeDeactivationInfo: overrides.NodeDeactivationInfo 
            ? { ...defaultDeactivationInfo, ...overrides.NodeDeactivationInfo } 
            : defaultDeactivationInfo
    };
}

/**
 * Creates a mock IRawService with sensible defaults.
 * Override any properties by passing them in the overrides parameter.
 * 
 * @param overrides - Partial IRawService to override default values
 * @returns A complete mock IRawService object
 * 
 * @example
 * const service = createMockService({ 
 *   Name: 'fabric:/MyApp/MyService',
 *   ServiceKind: 'Stateful'
 * });
 */
export function createMockService(overrides: Partial<IRawService> = {}): IRawService {
    return {
        Id: 'fabric:/MyApp/MyService',
        Name: 'fabric:/MyApp/MyService',
        TypeName: 'MyServiceType',
        ManifestVersion: '1.0.0',
        ServiceKind: 'Stateful',
        ServiceStatus: 'Active',
        HealthState: 'Ok',
        IsServiceGroup: false,
        ...overrides
    } as IRawService;
}

/**
 * Creates a mock IRawApplication with sensible defaults.
 * Override any properties by passing them in the overrides parameter.
 * 
 * @param overrides - Partial IRawApplication to override default values
 * @returns A complete mock IRawApplication object
 * 
 * @example
 * const app = createMockApplication({ 
 *   Name: 'fabric:/MyApplication',
 *   Status: 'Ready'
 * });
 */
export function createMockApplication(overrides: Partial<IRawApplication> = {}): IRawApplication {
    return {
        Id: 'MyApplication',
        Name: 'fabric:/MyApplication',
        TypeName: 'MyApplicationType',
        TypeVersion: '1.0.0',
        Parameters: [],
        Status: 'Ready',
        HealthState: 'Ok',
        ApplicationDefinitionKind: 'ServiceFabricApplicationDescription',
        ...overrides
    };
}

/**
 * Creates a mock IRawPartition with sensible defaults.
 * Override any properties by passing them in the overrides parameter.
 * 
 * @param overrides - Partial IRawPartition to override default values
 * @returns A complete mock IRawPartition object
 * 
 * @example
 * const partition = createMockPartition({ 
 *   PartitionStatus: 'Ready',
 *   HealthState: 'Ok'
 * });
 */
export function createMockPartition(overrides: Partial<IRawPartition> = {}): IRawPartition {
    const defaultPartitionInfo: IRawPartitionInformation = {
        Id: overrides.PartitionInformation?.Id || '12345678-1234-1234-1234-123456789012',
        ServicePartitionKind: 'Singleton',
        HighKey: '',
        LowKey: '',
        Name: ''
    };

    return {
        PartitionInformation: defaultPartitionInfo,
        InstanceId: '1',
        TargetReplicaSetSize: 3,
        MinReplicaSetSize: 2,
        HealthState: 'Ok',
        PartitionStatus: 'Ready',
        LastQuorumLossDuration: 'PT0S',
        CurrentConfigurationEpoch: {
            ConfigurationVersion: 1,
            DataLossVersion: 1
        },
        ServiceKind: 'Stateful',
        ...overrides,
        PartitionInformation: overrides.PartitionInformation 
            ? { ...defaultPartitionInfo, ...overrides.PartitionInformation }
            : defaultPartitionInfo
    } as IRawPartition;
}

/**
 * Creates a mock IRawReplicaOnPartition with sensible defaults.
 * Override any properties by passing them in the overrides parameter.
 * 
 * @param overrides - Partial IRawReplicaOnPartition to override default values
 * @returns A complete mock IRawReplicaOnPartition object
 * 
 * @example
 * const replica = createMockReplica({ 
 *   ReplicaRole: 'Primary',
 *   ReplicaStatus: 'Ready'
 * });
 */
export function createMockReplica(overrides: Partial<IRawReplicaOnPartition> = {}): IRawReplicaOnPartition {
    return {
        ReplicaId: '123456789',
        InstanceId: '123456789',
        ReplicaRole: 'Primary',
        PreviousReplicaRole: 'None',
        ReplicaStatus: 'Ready',
        HealthState: 'Ok',
        Address: '{"Endpoints":{"":"http://localhost:8080"}}',
        NodeName: 'Node_0',
        LastInBuildDurationInSeconds: '0',
        ServiceKind: 'Stateful',
        ...overrides
    } as IRawReplicaOnPartition;
}

/**
 * Creates a mock IRawHealthEvent with sensible defaults.
 * Override any properties by passing them in the overrides parameter.
 * 
 * @param overrides - Partial IRawHealthEvent to override default values
 * @returns A complete mock IRawHealthEvent object
 * 
 * @example
 * const healthEvent = createMockHealthEvent({ 
 *   HealthState: 'Warning',
 *   Description: 'Service is slow'
 * });
 */
export function createMockHealthEvent(overrides: Partial<IRawHealthEvent> = {}): IRawHealthEvent {
    return {
        SourceId: 'System.HealthMonitor',
        Property: 'State',
        HealthState: 'Ok',
        Description: 'Health check passed',
        TimeToLiveInMilliSeconds: '00:05:00',
        SequenceNumber: '1',
        RemoveWhenExpired: false,
        IsExpired: false,
        SourceUtcTimestamp: new Date().toISOString(),
        LastModifiedUtcTimestamp: new Date().toISOString(),
        ...overrides
    };
}

/**
 * Creates a mock IRawId with sensible defaults.
 * 
 * @param id - Optional ID string, defaults to a GUID-like string
 * @returns A complete mock IRawId object
 * 
 * @example
 * const id = createMockId('12345');
 */
export function createMockId(id?: string): IRawId {
    return {
        Id: id || '12345678-1234-1234-1234-123456789012'
    };
}

/**
 * Creates a mock IRawServiceDescription with sensible defaults.
 * Override any properties by passing them in the overrides parameter.
 * 
 * @param overrides - Partial IRawServiceDescription to override default values
 * @returns A complete mock IRawServiceDescription object
 * 
 * @example
 * const serviceDesc = createMockServiceDescription({ 
 *   ServiceName: 'fabric:/MyApp/MyService',
 *   ServiceTypeName: 'MyServiceType'
 * });
 */
export function createMockServiceDescription(overrides: Partial<IRawServiceDescription> = {}): IRawServiceDescription {
    return {
        ServiceKind: 'Stateful',
        ServiceName: 'fabric:/MyApp/MyService',
        ServiceTypeName: 'MyServiceType',
        ApplicationName: 'fabric:/MyApp',
        InitializationData: [],
        PartitionDescription: {
            PartitionScheme: 'Singleton'
        },
        TargetReplicaSetSize: 3,
        MinReplicaSetSize: 2,
        HasPersistedState: true,
        PlacementConstraints: '',
        CorrelationScheme: [],
        ServicePlacementPolicies: [],
        DefaultMoveCost: 'Zero',
        IsDefaultMoveCostSpecified: false,
        ServicePackageActivationMode: 'SharedProcess',
        ServiceDnsName: '',
        ScalingPolicies: [],
        ...overrides
    } as IRawServiceDescription;
}
