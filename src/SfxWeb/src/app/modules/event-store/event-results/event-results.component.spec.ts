import { TestBed } from '@angular/core/testing';
import { EventResultsComponent } from './event-results.component';

describe('EventResultsComponent', () => {
  let component: EventResultsComponent;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [EventResultsComponent] });
    component = TestBed.createComponent(EventResultsComponent).componentInstance;
    component.sources = [{ displayName: 'Cluster', type: 'Cluster', eventsList: {
      isInitialized: true, lastRefreshWasSuccessful: true,
      collection: [1, 2, 3].map(i => ({ raw: { kind: 'ClusterUpgradeCompleted', eventInstanceId: `id-${i}`, timeStamp: `2026-09-08T13:0${i}:00Z`, category: 'Upgrade', raw: { Kind: 'ClusterUpgradeCompleted', EventInstanceId: `id-${i}`, NodeName: `node-${i}` } } }))
    } }];
    component.ngOnChanges({});
  });
  it('normalizes wrapped events and sorts newest first', () => {
    expect(component.filtered[0].id).toBe('id-3');
    expect(component.filtered[0].entity).toBe('node-3');
    expect(JSON.parse(component.filtered[0].json).Kind).toBe('ClusterUpgradeCompleted');
  });
  it('searches raw details and resets pagination', () => {
    component.page = 2; component.query = 'node-2 Upgrade'; component.filter();
    expect(component.filtered.length).toBe(1); expect(component.filtered[0].id).toBe('id-2'); expect(component.page).toBe(1);
  });
  it('opens records requested by the navigator', () => {
    component.selectedId = 'id-1'; component.ngOnChanges({ selectedId: {} as any });
    expect(component.filtered.length).toBe(1); expect(component.expanded.has(component.filtered[0].key)).toBeTrue();
  });
  it('normalizes repair tasks without double-unwrapping raw JSON', () => {
    component.sources = [{ displayName: 'Repair Tasks', type: 'RepairTask', eventsList: { collection: [{ kind: 'RepairTask', eventInstanceId: 'task', timeStamp: '2026-09-08T00:00:00Z', raw: { TaskId: 'task', State: 'Completed', Action: 'Restart' } }] } }];
    component.ngOnChanges({}); expect(component.rows[0].type).toBe('task'); expect(component.rows[0].category).toBe('Completed'); expect(component.rows[0].entity).toBe('Restart');
  });
  it('reopens the same event after filters have changed', () => {
    component.selectedId = 'id-1'; component.ngOnChanges({ selectedId: {} as any });
    component.query = 'id-3'; component.filter(); component.expanded.clear();
    component.selectionVersion++; component.ngOnChanges({ selectionVersion: {} as any });
    expect(component.filtered[0].id).toBe('id-1');
    expect(component.expanded.has(component.filtered[0].key)).toBeTrue();
  });
});
