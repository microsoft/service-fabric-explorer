import { Node } from './Node';
import { DataService } from 'src/app/services/data.service';
import { createMockNode, createMockDataService } from 'src/app/testing';

// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

describe('Node', () => {
    let mockDataService: DataService;

    beforeEach(() => {
        mockDataService = createMockDataService();
    });

    describe('constructor', () => {
        it('should create a node with default raw data', () => {
            const rawNode = createMockNode();
            const node = new Node(mockDataService, rawNode);

            expect(node).toBeTruthy();
            expect(node.name).toBe(rawNode.Name);
        });

        it('should create a node with custom name', () => {
            const rawNode = createMockNode({ Name: 'CustomNode' });
            const node = new Node(mockDataService, rawNode);

            expect(node.name).toBe('CustomNode');
        });
    });

    describe('nodeStatus', () => {
        it('should return node status when not stopped', () => {
            const rawNode = createMockNode({ 
                NodeStatus: 'Up',
                IsStopped: false
            });
            const node = new Node(mockDataService, rawNode);

            expect(node.nodeStatus).toBe('Up');
        });

        it('should return "Down (Stopped)" when node is stopped', () => {
            const rawNode = createMockNode({ 
                NodeStatus: 'Down',
                IsStopped: true
            });
            const node = new Node(mockDataService, rawNode);

            expect(node.nodeStatus).toBe('Down (Stopped)');
        });

        it('should handle various node statuses', () => {
            const statuses = ['Up', 'Down', 'Enabling', 'Disabling', 'Disabled', 'Unknown'];
            
            statuses.forEach(status => {
                const rawNode = createMockNode({ 
                    NodeStatus: status,
                    IsStopped: false
                });
                const node = new Node(mockDataService, rawNode);

                expect(node.nodeStatus).toBe(status);
            });
        });
    });

    describe('id', () => {
        it('should return node id from raw data', () => {
            const rawNode = createMockNode({ 
                Id: { Id: 'test-node-id-12345' }
            });
            const node = new Node(mockDataService, rawNode);

            expect(node.id).toBe('test-node-id-12345');
        });
    });

    describe('upgradeDomain and faultDomain', () => {
        it('should return upgrade domain', () => {
            const rawNode = createMockNode({ UpgradeDomain: 'UD5' });
            const node = new Node(mockDataService, rawNode);

            expect(node.upgradeDomain).toBe('UD5');
        });

        it('should return fault domain', () => {
            const rawNode = createMockNode({ FaultDomain: 'fd:/rack1/node3' });
            const node = new Node(mockDataService, rawNode);

            expect(node.faultDomain).toBe('fd:/rack1/node3');
        });
    });

    describe('isDeactivating', () => {
        it('should return false when node is not deactivating', () => {
            const rawNode = createMockNode({
                NodeDeactivationInfo: {
                    NodeDeactivationStatus: 'None',
                    NodeDeactivationIntent: 'None',
                    NodeDeactivationTask: [],
                    PendingSafetyChecks: []
                }
            });
            const node = new Node(mockDataService, rawNode);

            expect(node.isDeactivating).toBe(false);
        });

        it('should return true when node is deactivating', () => {
            const rawNode = createMockNode({
                NodeDeactivationInfo: {
                    NodeDeactivationStatus: 'DeactivationComplete',
                    NodeDeactivationIntent: 'Pause',
                    NodeDeactivationTask: [{
                        NodeDeactivationTaskId: {
                            Id: 'task1'
                        },
                        NodeDeactivationIntent: 'Pause',
                        NodeDeactivationDescription: 'Test deactivation'
                    }],
                    PendingSafetyChecks: []
                }
            });
            const node = new Node(mockDataService, rawNode);

            expect(node.isDeactivating).toBe(true);
        });
    });

    describe('hasDeactivatingDescription', () => {
        it('should return false when not deactivating', () => {
            const rawNode = createMockNode({
                NodeDeactivationInfo: {
                    NodeDeactivationStatus: 'None',
                    NodeDeactivationIntent: 'None',
                    NodeDeactivationTask: [],
                    PendingSafetyChecks: []
                }
            });
            const node = new Node(mockDataService, rawNode);

            expect(node.hasDeactivatingDescription).toBe(false);
        });

        it('should return false when deactivating but no description', () => {
            const rawNode = createMockNode({
                NodeDeactivationInfo: {
                    NodeDeactivationStatus: 'DeactivationComplete',
                    NodeDeactivationIntent: 'Pause',
                    NodeDeactivationTask: [{
                        NodeDeactivationTaskId: {
                            Id: 'task1'
                        },
                        NodeDeactivationIntent: 'Pause'
                    }],
                    PendingSafetyChecks: []
                }
            });
            const node = new Node(mockDataService, rawNode);

            expect(node.hasDeactivatingDescription).toBe(false);
        });

        it('should return true when deactivating with description', () => {
            const rawNode = createMockNode({
                NodeDeactivationInfo: {
                    NodeDeactivationStatus: 'DeactivationComplete',
                    NodeDeactivationIntent: 'Pause',
                    NodeDeactivationTask: [{
                        NodeDeactivationTaskId: {
                            Id: 'task1'
                        },
                        NodeDeactivationIntent: 'Pause',
                        NodeDeactivationDescription: 'Deactivating for maintenance'
                    }],
                    PendingSafetyChecks: []
                }
            });
            const node = new Node(mockDataService, rawNode);

            expect(node.hasDeactivatingDescription).toBe(true);
        });
    });

    describe('tooltip', () => {
        it('should generate tooltip with node information', () => {
            const rawNode = createMockNode({
                Name: 'TestNode',
                Type: 'NodeType1',
                NodeStatus: 'Up',
                HealthState: 'Ok'
            });
            const node = new Node(mockDataService, rawNode);

            const tooltip = node.tooltip;
            
            expect(tooltip).toContain('TestNode');
            expect(tooltip).toContain('Type: NodeType1');
            expect(tooltip).toContain('Status: Up');
            expect(tooltip).toContain('Health State:');
        });
    });

    describe('seed node properties', () => {
        it('should identify seed nodes', () => {
            const rawNode = createMockNode({ IsSeedNode: true });
            const node = new Node(mockDataService, rawNode);

            expect(node.raw.IsSeedNode).toBe(true);
        });

        it('should identify non-seed nodes', () => {
            const rawNode = createMockNode({ IsSeedNode: false });
            const node = new Node(mockDataService, rawNode);

            expect(node.raw.IsSeedNode).toBe(false);
        });
    });

    describe('node health state', () => {
        it('should handle Ok health state', () => {
            const rawNode = createMockNode({ HealthState: 'Ok' });
            const node = new Node(mockDataService, rawNode);

            expect(node.raw.HealthState).toBe('Ok');
        });

        it('should handle Warning health state', () => {
            const rawNode = createMockNode({ HealthState: 'Warning' });
            const node = new Node(mockDataService, rawNode);

            expect(node.raw.HealthState).toBe('Warning');
        });

        it('should handle Error health state', () => {
            const rawNode = createMockNode({ HealthState: 'Error' });
            const node = new Node(mockDataService, rawNode);

            expect(node.raw.HealthState).toBe('Error');
        });
    });

    describe('node configuration', () => {
        it('should store code version', () => {
            const rawNode = createMockNode({ CodeVersion: '8.0.0.0' });
            const node = new Node(mockDataService, rawNode);

            expect(node.raw.CodeVersion).toBe('8.0.0.0');
        });

        it('should store config version', () => {
            const rawNode = createMockNode({ ConfigVersion: '2.0' });
            const node = new Node(mockDataService, rawNode);

            expect(node.raw.ConfigVersion).toBe('2.0');
        });

        it('should store IP address', () => {
            const rawNode = createMockNode({ IpAddressOrFQDN: '192.168.1.100' });
            const node = new Node(mockDataService, rawNode);

            expect(node.raw.IpAddressOrFQDN).toBe('192.168.1.100');
        });
    });
});
