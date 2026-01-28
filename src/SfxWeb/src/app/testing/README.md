# Test Utilities and Fixtures

This directory contains reusable test utilities, mock factories, and test data builders for Service Fabric Explorer unit tests.

## Overview

The test utilities help reduce boilerplate in test files and provide consistent, maintainable mock data. Instead of manually creating mock objects for every test, you can use these factories to generate realistic test data quickly.

## Available Utilities

### Mock Data Factories

Create mock raw data objects with sensible defaults. All factories accept optional overrides to customize specific properties.

```typescript
import { 
  createMockNode, 
  createMockService, 
  createMockApplication,
  createMockPartition,
  createMockReplica
} from 'src/app/testing';

// Create a mock node with defaults
const node = createMockNode();

// Override specific properties
const customNode = createMockNode({ 
  Name: 'CustomNode', 
  NodeStatus: 'Down',
  HealthState: 'Error'
});

// Create other entities
const service = createMockService({ Name: 'fabric:/MyApp/MyService' });
const app = createMockApplication({ TypeVersion: '2.0.0' });
const partition = createMockPartition({ PartitionStatus: 'InQuorumLoss' });
const replica = createMockReplica({ ReplicaRole: 'Primary' });
```

### Mock Services

Create mock service objects for dependency injection in tests.

```typescript
import { 
  createMockDataService, 
  createMockRestClientService,
  createMockStorageService
} from 'src/app/testing';

describe('MyComponent', () => {
  let mockDataService: DataService;
  let mockRestClient: RestClientService;

  beforeEach(() => {
    // Create mock services
    mockRestClient = createMockRestClientService({
      getNodes: () => of({ Items: [createMockNode()] })
    });

    mockDataService = createMockDataService({
      restClient: mockRestClient
    });
  });

  it('should load nodes', () => {
    // Use mocks in your tests
    const component = new MyComponent(mockDataService);
    // ...
  });
});
```

### Test Data Builder

For complex test scenarios with related entities, use the fluent `TestDataBuilder` API.

```typescript
import { TestDataBuilder } from 'src/app/testing';

describe('Service Health View', () => {
  it('should display unhealthy replicas', () => {
    // Build a complete test scenario
    const scenario = new TestDataBuilder()
      .withApplication('fabric:/MyApp')
      .withService('fabric:/MyApp/MyService')
      .withNodes(5)
      .withHealthyReplicas(3)
      .withReplica({ HealthState: 'Error', ReplicaStatus: 'Down' })
      .withErrorHealthEvent('Replica communication failed')
      .build();

    // Use the scenario data
    expect(scenario.replicas).toHaveLength(4);
    expect(scenario.replicas[3].HealthState).toBe('Error');
  });
});
```

### Creating Cluster Scenarios

For integration-like tests that need a full cluster simulation:

```typescript
import { createClusterScenario } from 'src/app/testing';

const scenario = createClusterScenario({
  nodeCount: 5,
  appCount: 3,
  servicesPerApp: 2
});

// scenario contains:
// - 5 nodes
// - 3 applications
// - 6 services (2 per app)
// All with realistic default data
```

## Best Practices

### 1. Use Factories for Simple Mocks

When you need a single mock object, use the factory functions:

```typescript
it('should handle node status', () => {
  const node = createMockNode({ NodeStatus: 'Up' });
  expect(node.NodeStatus).toBe('Up');
});
```

### 2. Use Builder for Related Objects

When testing scenarios with multiple related entities:

```typescript
it('should calculate cluster health from nodes', () => {
  const scenario = new TestDataBuilder()
    .withNode({ HealthState: 'Ok' })
    .withNode({ HealthState: 'Warning' })
    .withNode({ HealthState: 'Error' })
    .build();

  const health = calculateClusterHealth(scenario.nodes);
  expect(health).toBe('Error');
});
```

### 3. Override Only What Matters

Don't specify all properties—let defaults handle the rest:

```typescript
// Good: Only override what's important for the test
const service = createMockService({ ServiceStatus: 'Failed' });

// Avoid: Specifying unnecessary details
const service = createMockService({ 
  Id: 'fabric:/App/Service',
  Name: 'fabric:/App/Service',
  TypeName: 'ServiceType',
  ManifestVersion: '1.0.0',
  ServiceKind: ServiceKind.Stateful,
  ServiceStatus: 'Failed',  // Only this matters for the test
  HealthState: 'Ok',
  IsServiceGroup: false
});
```

### 4. Combine Factories and Services

Create complete test setups by combining mock data and services:

```typescript
describe('NodeDetailComponent', () => {
  let component: NodeDetailComponent;
  let mockDataService: DataService;

  beforeEach(() => {
    const mockNode = createMockNode({ Name: 'TestNode' });
    const mockRestClient = createMockRestClientService({
      getNode: () => of(mockNode)
    });

    mockDataService = createMockDataService({
      restClient: mockRestClient
    });

    component = new NodeDetailComponent(mockDataService);
  });

  // Your tests here
});
```

## Extending the Utilities

### Adding New Mock Factories

If you need a factory for a new entity type:

1. Add the factory function to `mock-data-factories.ts`
2. Include JSDoc comments explaining usage
3. Provide sensible defaults that work for most tests
4. Support partial overrides via the `overrides` parameter
5. Export the new factory from `index.ts`

Example:

```typescript
/**
 * Creates a mock IRawDeployedApplication with sensible defaults.
 * 
 * @param overrides - Partial to override default values
 * @returns A complete mock object
 */
export function createMockDeployedApplication(
  overrides: Partial<IRawDeployedApplication> = {}
): IRawDeployedApplication {
  return {
    Name: 'fabric:/MyApp',
    TypeName: 'MyAppType',
    Status: 'Active',
    WorkDirectory: '/work',
    ...overrides
  };
}
```

### Adding New Builder Methods

To add methods to `TestDataBuilder`:

1. Add a private field to store the data
2. Add a `with*` method that populates the field
3. Return `this` for chaining
4. Include the data in the `build()` return value
5. Clear the field in `reset()`

## Migration Guide

### Converting Existing Tests

Before (inline mocks):

```typescript
describe('Cluster', () => {
  const mockDataService: DataService = {
    restClient: {} as RestClientService,
    apps: {
      ensureInitialized: () => of(null)
    }
  } as DataService;

  it('should work', () => {
    const manifest = new ClusterManifest(mockDataService);
    // ...
  });
});
```

After (using utilities):

```typescript
import { createMockDataService } from 'src/app/testing';

describe('Cluster', () => {
  const mockDataService = createMockDataService();

  it('should work', () => {
    const manifest = new ClusterManifest(mockDataService);
    // ...
  });
});
```

## Additional Resources

- See existing tests in `src/app/Models/DataModels/cluster.spec.ts` for examples of the old approach
- See the new test examples in this directory for updated patterns
- For Angular-specific testing helpers, refer to the [Angular Testing Guide](https://angular.io/guide/testing)

## Contributing

When adding new test utilities:

1. Follow the established patterns for factories and builders
2. Include comprehensive JSDoc comments
3. Add examples to this README
4. Ensure backwards compatibility when modifying existing utilities
5. Write tests for complex utility functions

## Questions?

For questions or suggestions about the test utilities, open an issue or reach out to the maintainers.
