import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
import { ClusterResourceUsageVisualizationComponent } from './resource-usage-visualization.component';

describe('ClusterResourceUsageVisualizationComponent', () => {
  const getNodes = vi.fn();
  const getNodeEvents = vi.fn();
  const nodes = {
    collection: [] as object[],
    isInitialized: true,
    lastRefreshWasSuccessful: true
  };

  beforeEach(() => {
    getNodes.mockReset();
    getNodeEvents.mockReset();
    nodes.collection = [];
    nodes.isInitialized = true;
    nodes.lastRefreshWasSuccessful = true;
    getNodes.mockReturnValue(of(nodes));
    getNodeEvents.mockReturnValue(of([]));
    TestBed.configureTestingModule({
      declarations: [ClusterResourceUsageVisualizationComponent],
      providers: [{
        provide: DataService,
        useValue: {
          getNodes,
          restClient: { getNodeEvents }
        }
      }]
    }).overrideComponent(ClusterResourceUsageVisualizationComponent, { set: { template: '' } });
  });

  it('does not load resource usage after destruction', () => {
    const fixture = TestBed.createComponent(ClusterResourceUsageVisualizationComponent);
    const component = fixture.componentInstance;

    fixture.destroy();
    component.update({
      listEventStoreData: [],
      startDate: new Date(0),
      endDate: new Date(1)
    });

    expect(getNodeEvents).not.toHaveBeenCalled();
  });

  it('waits for node initialization and permits exactly 50 nodes', () => {
    const nodeLoad = new Subject<typeof nodes>();
    nodes.isInitialized = false;
    nodes.lastRefreshWasSuccessful = false;
    getNodes.mockReturnValue(nodeLoad);
    const fixture = TestBed.createComponent(ClusterResourceUsageVisualizationComponent);
    const component = fixture.componentInstance;

    component.update({
      listEventStoreData: [],
      startDate: new Date(0),
      endDate: new Date(1)
    });

    expect(getNodeEvents).not.toHaveBeenCalled();

    nodes.collection = Array.from({ length: 50 }, () => ({}));
    nodes.isInitialized = true;
    nodes.lastRefreshWasSuccessful = true;
    nodeLoad.next(nodes);
    nodeLoad.complete();

    expect(getNodeEvents).toHaveBeenCalledOnce();
    expect(component.clusterTooLarge).toBe(false);
    fixture.destroy();
  });

  it('does not request resource events for 51 nodes', () => {
    nodes.collection = Array.from({ length: 51 }, () => ({}));
    const fixture = TestBed.createComponent(ClusterResourceUsageVisualizationComponent);
    const component = fixture.componentInstance;

    component.update({
      listEventStoreData: [],
      startDate: new Date(0),
      endDate: new Date(1)
    });

    expect(getNodeEvents).not.toHaveBeenCalled();
    expect(component.clusterTooLarge).toBe(true);
    fixture.destroy();
  });

  it('does not request resource events when node initialization fails', () => {
    nodes.isInitialized = false;
    nodes.lastRefreshWasSuccessful = false;
    const fixture = TestBed.createComponent(ClusterResourceUsageVisualizationComponent);
    const component = fixture.componentInstance;

    component.update({
      listEventStoreData: [],
      startDate: new Date(0),
      endDate: new Date(1)
    });

    expect(getNodeEvents).not.toHaveBeenCalled();
    expect(component.nodeCountUnavailable).toBe(true);
    fixture.destroy();
  });

  it('reuses an identical in-flight date-window request', () => {
    const request = new Subject<never[]>();
    getNodeEvents.mockReturnValue(request);
    const fixture = TestBed.createComponent(ClusterResourceUsageVisualizationComponent);
    const component = fixture.componentInstance;
    const update = {
      listEventStoreData: [],
      startDate: new Date(0),
      endDate: new Date(1)
    };

    component.update(update);
    component.update(update);

    expect(getNodes).toHaveBeenCalledOnce();
    expect(getNodeEvents).toHaveBeenCalledOnce();
    expect(request.observers).toHaveLength(1);
    fixture.destroy();
  });

  it('uses the selected range when it is no longer than 90 minutes', () => {
    const fixture = TestBed.createComponent(ClusterResourceUsageVisualizationComponent);
    const component = fixture.componentInstance;
    const startDate = new Date('2026-10-08T10:00:00Z');
    const endDate = new Date('2026-10-08T11:00:00Z');

    component.update({ listEventStoreData: [], startDate, endDate });

    expect(getNodeEvents).toHaveBeenCalledWith(
      startDate,
      endDate,
      undefined,
      ['FabricProcessResourceUsage'],
      expect.anything()
    );
    expect(component.rangeLimited).toBe(false);
    fixture.destroy();
  });

  it('limits a longer selected range to its final 90 minutes', () => {
    const fixture = TestBed.createComponent(ClusterResourceUsageVisualizationComponent);
    const component = fixture.componentInstance;
    const startDate = new Date('2026-10-08T08:00:00Z');
    const endDate = new Date('2026-10-08T12:00:00Z');

    component.update({ listEventStoreData: [], startDate, endDate });

    expect(getNodeEvents).toHaveBeenCalledWith(
      new Date('2026-10-08T10:30:00Z'),
      endDate,
      undefined,
      ['FabricProcessResourceUsage'],
      expect.anything()
    );
    expect(component.rangeLimited).toBe(true);
    fixture.destroy();
  });
});
