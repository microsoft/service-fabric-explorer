import { of } from 'rxjs';
import { InfrastructureCollection } from './infrastructureCollection';
import { InfrastructureDocumentCollection } from './InfrastructureDocCollection';

describe('Infrastructure discovery without services', () => {
  const data = () => ({
    getSystemServices: () => of({ collection: [] }),
    getNodes: () => of({ collection: [] }),
    warnings: { removeNotificationById: () => {}, addOrUpdateNotification: () => {} }
  } as any);
  it('finishes job collection refresh with an empty result', () => {
    const collection = new InfrastructureCollection(data());
    let result: boolean | undefined;
    collection.refresh().subscribe(success => result = success);
    expect(result).toBeTrue();
    expect(collection.isRefreshing).toBeFalse();
    expect(collection.isInitialized).toBeTrue();
    expect(collection.collection).toEqual([]);
  });
  it('finishes document collection refresh and clears old document mappings', () => {
    const collection = new InfrastructureDocumentCollection(data());
    collection.InfrastructureServiceNameToDocumentsMap.set('old-service', []);
    let result: boolean | undefined;
    collection.refresh().subscribe(success => result = success);
    expect(result).toBeTrue();
    expect(collection.isRefreshing).toBeFalse();
    expect(collection.isInitialized).toBeTrue();
    expect(collection.InfrastructureServiceNameToDocumentsMap.size).toBe(0);
  });
});
