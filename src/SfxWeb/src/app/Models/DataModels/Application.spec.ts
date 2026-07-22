import { Application } from './Application';
import { DataService } from 'src/app/services/data.service';
import { createMockApplication, createMockDataService } from 'src/app/testing';
import { AppStatusConstants, Constants } from 'src/app/Common/Constants';

// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

describe('Application', () => {
    let mockDataService: DataService;

    beforeEach(() => {
        mockDataService = createMockDataService();
    });

    describe('constructor', () => {
        it('should create an application with default raw data', () => {
            const rawApp = createMockApplication();
            const app = new Application(mockDataService, rawApp);

            expect(app).toBeTruthy();
            expect(app.name).toBe(rawApp.Name);
        });

        it('should create an application with custom name', () => {
            const rawApp = createMockApplication({ Name: 'fabric:/CustomApp' });
            const app = new Application(mockDataService, rawApp);

            expect(app.name).toBe('fabric:/CustomApp');
        });
    });

    describe('isUpgrading', () => {
        it('should return true when status is Upgrading', () => {
            const rawApp = createMockApplication({ Status: AppStatusConstants.Upgrading });
            const app = new Application(mockDataService, rawApp);

            expect(app.isUpgrading).toBe(true);
        });

        it('should return false when status is not Upgrading', () => {
            const statuses = ['Ready', 'Creating', 'Deleting', 'Failed'];

            statuses.forEach(status => {
                const rawApp = createMockApplication({ Status: status });
                const app = new Application(mockDataService, rawApp);

                expect(app.isUpgrading).toBe(false);
            });
        });

        it('should return false for Ready status', () => {
            const rawApp = createMockApplication({ Status: 'Ready' });
            const app = new Application(mockDataService, rawApp);

            expect(app.isUpgrading).toBe(false);
        });
    });

    describe('application properties', () => {
        it('should store application type name', () => {
            const rawApp = createMockApplication({ TypeName: 'CustomAppType' });
            const app = new Application(mockDataService, rawApp);

            expect(app.raw.TypeName).toBe('CustomAppType');
        });

        it('should store application type version', () => {
            const rawApp = createMockApplication({ TypeVersion: '2.0.0' });
            const app = new Application(mockDataService, rawApp);

            expect(app.raw.TypeVersion).toBe('2.0.0');
        });

        it('should store application id', () => {
            const rawApp = createMockApplication({ Id: 'MyApplicationId' });
            const app = new Application(mockDataService, rawApp);

            expect(app.id).toBe('MyApplicationId');
        });

        it('should store health state', () => {
            const rawApp = createMockApplication({ HealthState: 'Warning' });
            const app = new Application(mockDataService, rawApp);

            expect(app.raw.HealthState).toBe('Warning');
        });
    });

    describe('isArmManaged', () => {
        it('should return false when no resource id', () => {
            const rawApp = createMockApplication();
            const app = new Application(mockDataService, rawApp);

            expect(app.isArmManaged).toBe(false);
        });

        it('should return true when resource id exists', () => {
            const rawApp = createMockApplication({
                ApplicationMetadata: {
                    ArmMetadata: {
                        ArmResourceId: '/subscriptions/123/resourceGroups/rg/providers/Microsoft.ServiceFabric/managedclusters/cluster/applications/app'
                    }
                }
            });
            const app = new Application(mockDataService, rawApp);

            expect(app.isArmManaged).toBe(true);
        });
    });

    describe('resourceId', () => {
        it('should return undefined when no metadata', () => {
            const rawApp = createMockApplication();
            const app = new Application(mockDataService, rawApp);

            expect(app.resourceId).toBeUndefined();
        });

        it('should return resource id when present', () => {
            const resourceId = '/subscriptions/123/resourceGroups/rg/providers/Microsoft.ServiceFabric/managedclusters/cluster/applications/app';
            const rawApp = createMockApplication({
                ApplicationMetadata: {
                    ArmMetadata: {
                        ArmResourceId: resourceId
                    }
                }
            });
            const app = new Application(mockDataService, rawApp);

            expect(app.resourceId).toBe(resourceId);
        });
    });

    describe('application definition kind', () => {
        it('should handle ServiceFabricApplicationDescription', () => {
            const rawApp = createMockApplication({ 
                ApplicationDefinitionKind: 'ServiceFabricApplicationDescription'
            });
            const app = new Application(mockDataService, rawApp);

            expect(app.raw.ApplicationDefinitionKind).toBe('ServiceFabricApplicationDescription');
        });

        it('should handle Compose applications', () => {
            const rawApp = createMockApplication({ 
                ApplicationDefinitionKind: Constants.ComposeApplicationDefinitionKind
            });
            const app = new Application(mockDataService, rawApp);

            expect(app.raw.ApplicationDefinitionKind).toBe(Constants.ComposeApplicationDefinitionKind);
        });
    });

    describe('application parameters', () => {
        it('should handle empty parameters', () => {
            const rawApp = createMockApplication({ Parameters: [] });
            const app = new Application(mockDataService, rawApp);

            expect(app.raw.Parameters).toEqual([]);
        });

        it('should handle multiple parameters', () => {
            const parameters = [
                { Key: 'Param1', Value: 'Value1' },
                { Key: 'Param2', Value: 'Value2' }
            ];
            const rawApp = createMockApplication({ Parameters: parameters });
            const app = new Application(mockDataService, rawApp);

            expect(app.raw.Parameters).toEqual(parameters);
            expect(app.raw.Parameters.length).toBe(2);
        });
    });

    describe('system application', () => {
        it('should identify system application', () => {
            const rawApp = createMockApplication({ 
                Name: Constants.SystemAppName,
                TypeName: Constants.SystemAppTypeName
            });
            const app = new Application(mockDataService, rawApp);

            expect(app.name).toBe(Constants.SystemAppName);
            expect(app.raw.TypeName).toBe(Constants.SystemAppTypeName);
        });

        it('should differentiate from user applications', () => {
            const rawApp = createMockApplication({ 
                Name: 'fabric:/MyApp',
                TypeName: 'MyAppType'
            });
            const app = new Application(mockDataService, rawApp);

            expect(app.name).not.toBe(Constants.SystemAppName);
            expect(app.raw.TypeName).not.toBe(Constants.SystemAppTypeName);
        });
    });

    describe('application status', () => {
        it('should handle Ready status', () => {
            const rawApp = createMockApplication({ Status: 'Ready' });
            const app = new Application(mockDataService, rawApp);

            expect(app.raw.Status).toBe('Ready');
        });

        it('should handle Creating status', () => {
            const rawApp = createMockApplication({ Status: 'Creating' });
            const app = new Application(mockDataService, rawApp);

            expect(app.raw.Status).toBe('Creating');
        });

        it('should handle Deleting status', () => {
            const rawApp = createMockApplication({ Status: 'Deleting' });
            const app = new Application(mockDataService, rawApp);

            expect(app.raw.Status).toBe('Deleting');
        });

        it('should handle Failed status', () => {
            const rawApp = createMockApplication({ Status: 'Failed' });
            const app = new Application(mockDataService, rawApp);

            expect(app.raw.Status).toBe('Failed');
        });
    });

    describe('health states', () => {
        it('should handle Ok health state', () => {
            const rawApp = createMockApplication({ HealthState: 'Ok' });
            const app = new Application(mockDataService, rawApp);

            expect(app.raw.HealthState).toBe('Ok');
        });

        it('should handle Warning health state', () => {
            const rawApp = createMockApplication({ HealthState: 'Warning' });
            const app = new Application(mockDataService, rawApp);

            expect(app.raw.HealthState).toBe('Warning');
        });

        it('should handle Error health state', () => {
            const rawApp = createMockApplication({ HealthState: 'Error' });
            const app = new Application(mockDataService, rawApp);

            expect(app.raw.HealthState).toBe('Error');
        });

        it('should handle Unknown health state', () => {
            const rawApp = createMockApplication({ HealthState: 'Unknown' });
            const app = new Application(mockDataService, rawApp);

            expect(app.raw.HealthState).toBe('Unknown');
        });
    });
});
