import { TestDataBuilder, createClusterScenario } from './test-data-builder';
import { createMockNode, createMockHealthEvent } from './mock-data-factories';

// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

/**
 * Example tests demonstrating how to use the TestDataBuilder.
 * These examples show common patterns for building test scenarios.
 */

describe('TestDataBuilder Examples', () => {
    
    describe('Basic usage', () => {
        it('should build a simple scenario', () => {
            const scenario = new TestDataBuilder()
                .withApplication('fabric:/MyApp')
                .withService('fabric:/MyApp/MyService')
                .build();

            expect(scenario.application).toBeTruthy();
            expect(scenario.application?.Name).toBe('fabric:/MyApp');
            expect(scenario.service).toBeTruthy();
            expect(scenario.service?.Name).toBe('fabric:/MyApp/MyService');
        });

        it('should build a scenario with multiple nodes', () => {
            const scenario = new TestDataBuilder()
                .withNodes(3)
                .build();

            expect(scenario.nodes).toHaveLength(3);
            expect(scenario.nodes[0].Name).toBe('Node_0');
            expect(scenario.nodes[1].Name).toBe('Node_1');
            expect(scenario.nodes[2].Name).toBe('Node_2');
        });
    });

    describe('Replica scenarios', () => {
        it('should create healthy replicas', () => {
            const scenario = new TestDataBuilder()
                .withHealthyReplicas(3)
                .build();

            expect(scenario.replicas).toHaveLength(3);
            expect(scenario.replicas[0].ReplicaRole).toBe('Primary');
            expect(scenario.replicas[1].ReplicaRole).toBe('ActiveSecondary');
            expect(scenario.replicas[2].ReplicaRole).toBe('ActiveSecondary');
            
            scenario.replicas.forEach(replica => {
                expect(replica.ReplicaStatus).toBe('Ready');
                expect(replica.HealthState).toBe('Ok');
            });
        });

        it('should create a scenario with unhealthy replica', () => {
            const scenario = new TestDataBuilder()
                .withHealthyReplicas(2)
                .withReplica({ 
                    HealthState: 'Error', 
                    ReplicaStatus: 'Down',
                    ReplicaRole: 'ActiveSecondary'
                })
                .build();

            expect(scenario.replicas).toHaveLength(3);
            
            const healthyReplicas = scenario.replicas.filter(r => r.HealthState === 'Ok');
            const unhealthyReplicas = scenario.replicas.filter(r => r.HealthState === 'Error');
            
            expect(healthyReplicas).toHaveLength(2);
            expect(unhealthyReplicas).toHaveLength(1);
        });
    });

    describe('Health event scenarios', () => {
        it('should create warning scenario', () => {
            const scenario = new TestDataBuilder()
                .withApplication('fabric:/MyApp')
                .withWarningHealthEvent('High memory usage detected')
                .build();

            expect(scenario.healthEvents).toHaveLength(1);
            expect(scenario.healthEvents[0].HealthState).toBe('Warning');
            expect(scenario.healthEvents[0].Description).toBe('High memory usage detected');
        });

        it('should create error scenario', () => {
            const scenario = new TestDataBuilder()
                .withService('fabric:/MyApp/MyService')
                .withErrorHealthEvent('Service endpoint unreachable')
                .build();

            expect(scenario.healthEvents).toHaveLength(1);
            expect(scenario.healthEvents[0].HealthState).toBe('Error');
            expect(scenario.healthEvents[0].Description).toBe('Service endpoint unreachable');
        });

        it('should create complex health scenario', () => {
            const scenario = new TestDataBuilder()
                .withApplication('fabric:/MyApp')
                .withService('fabric:/MyApp/MyService')
                .withHealthEvent({ HealthState: 'Ok', Description: 'All checks passed' })
                .withWarningHealthEvent('Slow response time')
                .withErrorHealthEvent('Failed health check')
                .build();

            expect(scenario.healthEvents).toHaveLength(3);
            
            const okEvents = scenario.healthEvents.filter(e => e.HealthState === 'Ok');
            const warningEvents = scenario.healthEvents.filter(e => e.HealthState === 'Warning');
            const errorEvents = scenario.healthEvents.filter(e => e.HealthState === 'Error');
            
            expect(okEvents).toHaveLength(1);
            expect(warningEvents).toHaveLength(1);
            expect(errorEvents).toHaveLength(1);
        });
    });

    describe('Complex scenarios', () => {
        it('should create a full application deployment scenario', () => {
            const scenario = new TestDataBuilder()
                .withApplication('fabric:/WebApp', { TypeVersion: '2.0.0' })
                .withService('fabric:/WebApp/Frontend', { ServiceKind: 'Stateless' })
                .withService('fabric:/WebApp/Backend', { ServiceKind: 'Stateful' })
                .withNodes(5, 'WebNodeType')
                .withHealthyReplicas(3)
                .withHealthEvent({ HealthState: 'Ok', Description: 'Deployment successful' })
                .build();

            expect(scenario.application?.Name).toBe('fabric:/WebApp');
            expect(scenario.application?.TypeVersion).toBe('2.0.0');
            expect(scenario.nodes).toHaveLength(5);
            expect(scenario.replicas).toHaveLength(3);
            expect(scenario.healthEvents).toHaveLength(1);
        });

        it('should create an upgrade scenario', () => {
            const scenario = new TestDataBuilder()
                .withApplication('fabric:/MyApp', { 
                    Status: 'Upgrading',
                    TypeVersion: '3.0.0'
                })
                .withService('fabric:/MyApp/MyService')
                .withNodes(5)
                .withHealthyReplicas(2)
                .withReplica({ 
                    HealthState: 'Warning', 
                    ReplicaStatus: 'Ready',
                    ReplicaRole: 'ActiveSecondary'
                })
                .withWarningHealthEvent('Upgrade in progress')
                .build();

            expect(scenario.application?.Status).toBe('Upgrading');
            expect(scenario.replicas).toHaveLength(3);
            
            const warningReplicas = scenario.replicas.filter(r => r.HealthState === 'Warning');
            expect(warningReplicas).toHaveLength(1);
        });
    });

    describe('Cluster scenarios', () => {
        it('should create a small cluster scenario', () => {
            const scenario = createClusterScenario({
                nodeCount: 3,
                appCount: 2,
                servicesPerApp: 2
            });

            expect(scenario.nodes).toHaveLength(3);
            expect(scenario.applications).toHaveLength(2);
            expect(scenario.services).toHaveLength(4);
        });

        it('should create a large cluster scenario', () => {
            const scenario = createClusterScenario({
                nodeCount: 10,
                appCount: 5,
                servicesPerApp: 3
            });

            expect(scenario.nodes).toHaveLength(10);
            expect(scenario.applications).toHaveLength(5);
            expect(scenario.services).toHaveLength(15);
        });
    });

    describe('Builder reset', () => {
        it('should reset builder for new scenario', () => {
            const builder = new TestDataBuilder();
            
            const scenario1 = builder
                .withApplication('fabric:/App1')
                .withNodes(3)
                .build();

            expect(scenario1.application?.Name).toBe('fabric:/App1');
            expect(scenario1.nodes).toHaveLength(3);

            const scenario2 = builder
                .reset()
                .withApplication('fabric:/App2')
                .withNodes(5)
                .build();

            expect(scenario2.application?.Name).toBe('fabric:/App2');
            expect(scenario2.nodes).toHaveLength(5);
        });
    });

    describe('Chaining patterns', () => {
        it('should support fluent API chaining', () => {
            const scenario = new TestDataBuilder()
                .withApplication('fabric:/MyApp')
                .withService('fabric:/MyApp/Service1')
                .withService('fabric:/MyApp/Service2')
                .withPartition()
                .withPartition()
                .withNodes(3)
                .withHealthyReplicas(2)
                .withHealthEvent({ HealthState: 'Ok' })
                .build();

            expect(scenario.application).toBeTruthy();
            expect(scenario.service).toBeTruthy();
            expect(scenario.partitions).toHaveLength(2);
            expect(scenario.nodes).toHaveLength(3);
            expect(scenario.replicas).toHaveLength(2);
            expect(scenario.healthEvents).toHaveLength(1);
        });
    });
});
