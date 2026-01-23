import { Service, isStatefulService, isStatelessService, isSelfReconfiguringService } from './Service';
import { DataService } from 'src/app/services/data.service';
import { Application } from './Application';
import { createMockService, createMockApplication, createMockDataService } from 'src/app/testing';
import { ServiceKind } from '../RawDataTypes';

// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

describe('Service', () => {
    let mockDataService: DataService;
    let mockApplication: Application;

    beforeEach(() => {
        mockDataService = createMockDataService();
        const rawApp = createMockApplication({ Name: 'fabric:/TestApp' });
        mockApplication = new Application(mockDataService, rawApp);
    });

    describe('constructor', () => {
        it('should create a service with default raw data', () => {
            const rawService = createMockService();
            const service = new Service(mockDataService, rawService, mockApplication);

            expect(service).toBeTruthy();
            expect(service.name).toBe(rawService.Name);
            expect(service.parent).toBe(mockApplication);
        });

        it('should create a service with custom name', () => {
            const rawService = createMockService({ Name: 'fabric:/TestApp/CustomService' });
            const service = new Service(mockDataService, rawService, mockApplication);

            expect(service.name).toBe('fabric:/TestApp/CustomService');
        });
    });

    describe('service kind type guards', () => {
        it('should identify stateful services', () => {
            const rawService = createMockService({ ServiceKind: ServiceKind.Stateful });
            
            expect(isStatefulService(rawService)).toBe(true);
            expect(isStatelessService(rawService)).toBe(false);
            expect(isSelfReconfiguringService(rawService)).toBe(false);
        });

        it('should identify stateless services', () => {
            const rawService = createMockService({ ServiceKind: ServiceKind.Stateless });
            
            expect(isStatefulService(rawService)).toBe(false);
            expect(isStatelessService(rawService)).toBe(true);
            expect(isSelfReconfiguringService(rawService)).toBe(false);
        });

        it('should identify self-reconfiguring services', () => {
            const rawService = createMockService({ ServiceKind: 'SelfReconfiguring' as any });
            
            expect(isStatefulService(rawService)).toBe(false);
            expect(isStatelessService(rawService)).toBe(false);
            expect(isSelfReconfiguringService(rawService)).toBe(true);
        });
    });

    describe('isStatefulService', () => {
        it('should return true for stateful services', () => {
            const rawService = createMockService({ ServiceKind: ServiceKind.Stateful });
            const service = new Service(mockDataService, rawService, mockApplication);

            expect(service.isStatefulService).toBe(true);
        });

        it('should return false for stateless services', () => {
            const rawService = createMockService({ ServiceKind: ServiceKind.Stateless });
            const service = new Service(mockDataService, rawService, mockApplication);

            expect(service.isStatefulService).toBe(false);
        });
    });

    describe('isStatelessService', () => {
        it('should return true for stateless services', () => {
            const rawService = createMockService({ ServiceKind: ServiceKind.Stateless });
            const service = new Service(mockDataService, rawService, mockApplication);

            expect(service.isStatelessService).toBe(true);
        });

        it('should return false for stateful services', () => {
            const rawService = createMockService({ ServiceKind: ServiceKind.Stateful });
            const service = new Service(mockDataService, rawService, mockApplication);

            expect(service.isStatelessService).toBe(false);
        });
    });

    describe('isSelfReconfiguringService', () => {
        it('should return true for self-reconfiguring services', () => {
            const rawService = createMockService({ ServiceKind: 'SelfReconfiguring' as any });
            const service = new Service(mockDataService, rawService, mockApplication);

            expect(service.isSelfReconfiguringService).toBe(true);
        });

        it('should return false for other service kinds', () => {
            const rawService = createMockService({ ServiceKind: ServiceKind.Stateful });
            const service = new Service(mockDataService, rawService, mockApplication);

            expect(service.isSelfReconfiguringService).toBe(false);
        });
    });

    describe('serviceKindInNumber', () => {
        it('should return 1 for stateless services', () => {
            const rawService = createMockService({ ServiceKind: ServiceKind.Stateless });
            const service = new Service(mockDataService, rawService, mockApplication);

            expect(service.serviceKindInNumber).toBe(1);
        });

        it('should return 2 for stateful services', () => {
            const rawService = createMockService({ ServiceKind: ServiceKind.Stateful });
            const service = new Service(mockDataService, rawService, mockApplication);

            expect(service.serviceKindInNumber).toBe(2);
        });

        it('should return 3 for self-reconfiguring services', () => {
            const rawService = createMockService({ ServiceKind: 'SelfReconfiguring' as any });
            const service = new Service(mockDataService, rawService, mockApplication);

            expect(service.serviceKindInNumber).toBe(3);
        });
    });

    describe('service properties', () => {
        it('should store service type name', () => {
            const rawService = createMockService({ TypeName: 'CustomServiceType' });
            const service = new Service(mockDataService, rawService, mockApplication);

            expect(service.raw.TypeName).toBe('CustomServiceType');
        });

        it('should store manifest version', () => {
            const rawService = createMockService({ ManifestVersion: '2.0.0' });
            const service = new Service(mockDataService, rawService, mockApplication);

            expect(service.raw.ManifestVersion).toBe('2.0.0');
        });

        it('should store service status', () => {
            const rawService = createMockService({ ServiceStatus: 'Active' });
            const service = new Service(mockDataService, rawService, mockApplication);

            expect(service.raw.ServiceStatus).toBe('Active');
        });

        it('should store health state', () => {
            const rawService = createMockService({ HealthState: 'Warning' });
            const service = new Service(mockDataService, rawService, mockApplication);

            expect(service.raw.HealthState).toBe('Warning');
        });
    });

    describe('isArmManaged', () => {
        it('should return false when no resource id', () => {
            const rawService = createMockService();
            const service = new Service(mockDataService, rawService, mockApplication);

            expect(service.isArmManaged).toBe(false);
        });

        it('should return true when resource id exists', () => {
            const rawService = createMockService({
                ServiceMetadata: {
                    ArmMetadata: {
                        ArmResourceId: '/subscriptions/123/resourceGroups/rg/providers/Microsoft.ServiceFabric/managedclusters/cluster/applications/app/services/service'
                    }
                }
            } as any);
            const service = new Service(mockDataService, rawService, mockApplication);

            expect(service.isArmManaged).toBe(true);
        });
    });

    describe('resourceId', () => {
        it('should return undefined when no metadata', () => {
            const rawService = createMockService();
            const service = new Service(mockDataService, rawService, mockApplication);

            expect(service.resourceId).toBeUndefined();
        });

        it('should return resource id when present', () => {
            const resourceId = '/subscriptions/123/resourceGroups/rg/providers/Microsoft.ServiceFabric/managedclusters/cluster/applications/app/services/service';
            const rawService = createMockService({
                ServiceMetadata: {
                    ArmMetadata: {
                        ArmResourceId: resourceId
                    }
                }
            } as any);
            const service = new Service(mockDataService, rawService, mockApplication);

            expect(service.resourceId).toBe(resourceId);
        });
    });

    describe('service group', () => {
        it('should handle service groups', () => {
            const rawService = createMockService({ IsServiceGroup: true });
            const service = new Service(mockDataService, rawService, mockApplication);

            expect(service.raw.IsServiceGroup).toBe(true);
        });

        it('should handle regular services', () => {
            const rawService = createMockService({ IsServiceGroup: false });
            const service = new Service(mockDataService, rawService, mockApplication);

            expect(service.raw.IsServiceGroup).toBe(false);
        });
    });
});
