import { 
    IRawNode, 
    IRawService, 
    IRawApplication, 
    IRawPartition, 
    IRawReplica,
    IRawHealthEvent 
} from '../Models/RawDataTypes';
import { 
    createMockNode, 
    createMockService, 
    createMockApplication, 
    createMockPartition, 
    createMockReplica,
    createMockHealthEvent 
} from './mock-data-factories';

// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

/**
 * Fluent builder for creating complex test data scenarios.
 * Use this when you need to build related objects with consistent data.
 * 
 * Usage:
 * ```typescript
 * const scenario = new TestDataBuilder()
 *   .withApplication('fabric:/MyApp')
 *   .withService('fabric:/MyApp/MyService')
 *   .withHealthyReplicas(3)
 *   .build();
 * ```
 */
export class TestDataBuilder {
    private application: IRawApplication | null = null;
    private service: IRawService | null = null;
    private partitions: IRawPartition[] = [];
    private replicas: IRawReplica[] = [];
    private nodes: IRawNode[] = [];
    private healthEvents: IRawHealthEvent[] = [];

    /**
     * Adds an application to the test scenario.
     * 
     * @param appName - The application name (e.g., 'fabric:/MyApp')
     * @param overrides - Optional property overrides
     * @returns This builder for chaining
     */
    withApplication(appName: string, overrides: Partial<IRawApplication> = {}): this {
        this.application = createMockApplication({
            Name: appName,
            Id: appName.replace('fabric:/', ''),
            ...overrides
        });
        return this;
    }

    /**
     * Adds a service to the test scenario.
     * 
     * @param serviceName - The service name (e.g., 'fabric:/MyApp/MyService')
     * @param overrides - Optional property overrides
     * @returns This builder for chaining
     */
    withService(serviceName: string, overrides: Partial<IRawService> = {}): this {
        this.service = createMockService({
            Name: serviceName,
            Id: serviceName,
            ...overrides
        });
        return this;
    }

    /**
     * Adds a partition to the test scenario.
     * 
     * @param overrides - Optional property overrides
     * @returns This builder for chaining
     */
    withPartition(overrides: Partial<IRawPartition> = {}): this {
        this.partitions.push(createMockPartition(overrides));
        return this;
    }

    /**
     * Adds multiple healthy replicas to the test scenario.
     * 
     * @param count - Number of replicas to create
     * @param nodePrefix - Prefix for node names (default: 'Node_')
     * @returns This builder for chaining
     */
    withHealthyReplicas(count: number, nodePrefix: string = 'Node_'): this {
        for (let i = 0; i < count; i++) {
            this.replicas.push(createMockReplica({
                Id: String(i),
                NodeName: `${nodePrefix}${i}`,
                ReplicaRole: i === 0 ? 'Primary' : 'ActiveSecondary',
                ReplicaStatus: 'Ready',
                HealthState: 'Ok'
            }));
        }
        return this;
    }

    /**
     * Adds a replica with specific properties to the test scenario.
     * 
     * @param overrides - Property overrides for the replica
     * @returns This builder for chaining
     */
    withReplica(overrides: Partial<IRawReplica> = {}): this {
        this.replicas.push(createMockReplica(overrides));
        return this;
    }

    /**
     * Adds multiple nodes to the test scenario.
     * 
     * @param count - Number of nodes to create
     * @param nodeType - Node type name (default: 'NodeType0')
     * @returns This builder for chaining
     */
    withNodes(count: number, nodeType: string = 'NodeType0'): this {
        for (let i = 0; i < count; i++) {
            this.nodes.push(createMockNode({
                Name: `Node_${i}`,
                Type: nodeType,
                IpAddressOrFQDN: `10.0.0.${i + 1}`,
                UpgradeDomain: `UD${i % 5}`,
                FaultDomain: `fd:/${i % 3}`
            }));
        }
        return this;
    }

    /**
     * Adds a node with specific properties to the test scenario.
     * 
     * @param overrides - Property overrides for the node
     * @returns This builder for chaining
     */
    withNode(overrides: Partial<IRawNode> = {}): this {
        this.nodes.push(createMockNode(overrides));
        return this;
    }

    /**
     * Adds a health event to the test scenario.
     * 
     * @param overrides - Property overrides for the health event
     * @returns This builder for chaining
     */
    withHealthEvent(overrides: Partial<IRawHealthEvent> = {}): this {
        this.healthEvents.push(createMockHealthEvent(overrides));
        return this;
    }

    /**
     * Adds a warning health event to the test scenario.
     * 
     * @param description - Description of the warning
     * @returns This builder for chaining
     */
    withWarningHealthEvent(description: string): this {
        this.healthEvents.push(createMockHealthEvent({
            HealthState: 'Warning',
            Description: description,
            SourceId: 'System.Test'
        }));
        return this;
    }

    /**
     * Adds an error health event to the test scenario.
     * 
     * @param description - Description of the error
     * @returns This builder for chaining
     */
    withErrorHealthEvent(description: string): this {
        this.healthEvents.push(createMockHealthEvent({
            HealthState: 'Error',
            Description: description,
            SourceId: 'System.Test'
        }));
        return this;
    }

    /**
     * Builds and returns the test data scenario.
     * 
     * @returns An object containing all the built test data
     */
    build() {
        return {
            application: this.application,
            service: this.service,
            partitions: this.partitions,
            replicas: this.replicas,
            nodes: this.nodes,
            healthEvents: this.healthEvents
        };
    }

    /**
     * Resets the builder to start a new scenario.
     * 
     * @returns This builder for chaining
     */
    reset(): this {
        this.application = null;
        this.service = null;
        this.partitions = [];
        this.replicas = [];
        this.nodes = [];
        this.healthEvents = [];
        return this;
    }
}

/**
 * Creates a complete cluster test scenario with multiple applications and services.
 * 
 * @param options - Configuration options for the scenario
 * @returns A test scenario with multiple entities
 * 
 * @example
 * const scenario = createClusterScenario({
 *   nodeCount: 5,
 *   appCount: 2,
 *   servicesPerApp: 3
 * });
 */
export function createClusterScenario(options: {
    nodeCount?: number;
    appCount?: number;
    servicesPerApp?: number;
} = {}) {
    const {
        nodeCount = 5,
        appCount = 2,
        servicesPerApp = 2
    } = options;

    const builder = new TestDataBuilder();

    // Add nodes
    builder.withNodes(nodeCount);

    const applications: IRawApplication[] = [];
    const services: IRawService[] = [];

    // Add applications and services
    for (let i = 0; i < appCount; i++) {
        const appName = `fabric:/App${i}`;
        builder.withApplication(appName, {
            TypeName: `AppType${i}`,
            TypeVersion: '1.0.0'
        });
        applications.push(builder.build().application!);

        for (let j = 0; j < servicesPerApp; j++) {
            const serviceName = `${appName}/Service${j}`;
            builder.withService(serviceName, {
                TypeName: `ServiceType${j}`,
                ManifestVersion: '1.0.0'
            });
            services.push(builder.build().service!);
        }
    }

    const scenario = builder.build();
    return {
        ...scenario,
        applications,
        services
    };
}
