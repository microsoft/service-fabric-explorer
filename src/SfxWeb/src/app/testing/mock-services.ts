import { Observable, of } from 'rxjs';
import { DataService } from '../services/data.service';
import { RestClientService } from '../services/rest-client.service';
import { StorageService } from '../services/storage.service';
import { IResponseMessageHandler } from '../Common/ResponseMessageHandlers';

// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

/**
 * Mock implementations of commonly used services for testing.
 * These mocks provide simple, predictable behavior for unit tests.
 * 
 * Usage:
 * ```typescript
 * const mockDataService = createMockDataService();
 * const mockRestClient = createMockRestClientService();
 * ```
 */

/**
 * Creates a mock DataService with common methods stubbed out.
 * Override any methods by extending the returned object.
 * 
 * @param overrides - Partial DataService to override default mock behavior
 * @returns A mock DataService object
 * 
 * @example
 * const dataService = createMockDataService({
 *   restClient: myCustomRestClient,
 *   apps: { ensureInitialized: () => of(null) }
 * });
 */
export function createMockDataService(overrides: Partial<DataService> = {}): DataService {
    const mock: Partial<DataService> = {
        restClient: createMockRestClientService(),
        apps: {
            ensureInitialized: () => of(null)
        } as any,
        nodes: {
            ensureInitialized: () => of(null)
        } as any,
        systemApp: {
            ensureInitialized: () => of(null)
        } as any,
        clusterManifest: {
            ensureInitialized: () => of(null)
        } as any,
        clusterUpgradeProgress: {
            ensureInitialized: () => of(null)
        } as any,
        actionsEnabled: () => false,
        ...overrides
    };

    return mock as DataService;
}

/**
 * Creates a mock RestClientService with common methods stubbed out.
 * Override any methods by extending the returned object.
 * 
 * @param overrides - Partial RestClientService to override default mock behavior
 * @returns A mock RestClientService object
 * 
 * @example
 * const restClient = createMockRestClientService({
 *   getNodes: () => of({ Items: [mockNode] })
 * });
 */
export function createMockRestClientService(overrides: Partial<RestClientService> = {}): RestClientService {
    const mock: Partial<RestClientService> = {
        getClusterHealth: (messageHandler?: IResponseMessageHandler) => of({
            AggregatedHealthState: 'Ok',
            HealthEvents: [],
            UnhealthyEvaluations: [],
            NodeHealthStates: [],
            ApplicationHealthStates: [],
            HealthStatistics: {
                HealthStateCountList: []
            }
        } as any),
        getClusterManifest: (messageHandler?: IResponseMessageHandler) => of({
            Manifest: '<ClusterManifest></ClusterManifest>'
        } as any),
        getNodes: (messageHandler?: IResponseMessageHandler) => of({
            ContinuationToken: '',
            Items: []
        } as any),
        getNode: (nodeName: string, messageHandler?: IResponseMessageHandler) => of(null as any),
        getApplications: (messageHandler?: IResponseMessageHandler) => of({
            ContinuationToken: '',
            Items: []
        } as any),
        getServices: (appId: string, messageHandler?: IResponseMessageHandler) => of({
            ContinuationToken: '',
            Items: []
        } as any),
        getPartitions: (appId: string, serviceId: string, messageHandler?: IResponseMessageHandler) => of({
            ContinuationToken: '',
            Items: []
        } as any),
        getReplicas: (appId: string, serviceId: string, partitionId: string, messageHandler?: IResponseMessageHandler) => of({
            ContinuationToken: '',
            Items: []
        } as any),
        ...overrides
    };

    return mock as RestClientService;
}

/**
 * Creates a mock StorageService with common methods stubbed out.
 * Override any methods by extending the returned object.
 * 
 * @param overrides - Partial StorageService to override default mock behavior
 * @returns A mock StorageService object
 * 
 * @example
 * const storage = createMockStorageService({
 *   getValueBoolean: (key) => true
 * });
 */
export function createMockStorageService(overrides: Partial<StorageService> = {}): StorageService {
    const mockStorage: { [key: string]: any } = {};

    const mock: Partial<StorageService> = {
        getValueString: (key: string, defaultValue?: string) => {
            return mockStorage[key] !== undefined ? String(mockStorage[key]) : (defaultValue || '');
        },
        getValueBoolean: (key: string, defaultValue?: boolean) => {
            return mockStorage[key] !== undefined ? Boolean(mockStorage[key]) : (defaultValue || false);
        },
        getValueNumber: (key: string, defaultValue?: number) => {
            return mockStorage[key] !== undefined ? Number(mockStorage[key]) : (defaultValue || 0);
        },
        setValue: (key: string, value: any) => {
            mockStorage[key] = value;
        },
        clearAll: () => {
            Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
        },
        ...overrides
    };

    return mock as StorageService;
}

/**
 * Creates a simple mock IResponseMessageHandler.
 * 
 * @returns A mock IResponseMessageHandler object
 * 
 * @example
 * const handler = createMockResponseHandler();
 */
export function createMockResponseHandler(): IResponseMessageHandler {
    return {
        handle: (response: any) => { /* no-op */ }
    } as IResponseMessageHandler;
}
