// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

/**
 * Test utilities and fixtures for Service Fabric Explorer.
 * 
 * This module provides reusable test fixtures, mock factories, and test data builders
 * to simplify unit testing across the application.
 * 
 * @example
 * ```typescript
 * import { createMockNode, createMockDataService, TestDataBuilder } from 'src/app/testing';
 * 
 * // Create a simple mock
 * const node = createMockNode({ Name: 'MyNode', NodeStatus: 'Up' });
 * 
 * // Use a builder for complex scenarios
 * const scenario = new TestDataBuilder()
 *   .withApplication('fabric:/MyApp')
 *   .withService('fabric:/MyApp/MyService')
 *   .withHealthyReplicas(3)
 *   .build();
 * ```
 */

// Export all mock data factories
export {
    createMockNode,
    createMockService,
    createMockApplication,
    createMockPartition,
    createMockReplica,
    createMockCluster,
    createMockHealthEvent,
    createMockId,
    createMockServiceDescription
} from './mock-data-factories';

// Export all mock services
export {
    createMockDataService,
    createMockRestClientService,
    createMockStorageService,
    createMockResponseHandler
} from './mock-services';

// Export test data builder
export {
    TestDataBuilder,
    createClusterScenario
} from './test-data-builder';
