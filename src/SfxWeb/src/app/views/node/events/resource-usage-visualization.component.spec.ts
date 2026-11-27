import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { NodeEvent } from 'src/app/Models/eventstore/Events';
import { DataService } from 'src/app/services/data.service';
import { ResourceUsageVisualizationComponent } from './resource-usage-visualization.component';

describe('ResourceUsageVisualizationComponent', () => {
  const getNodeEvents = vi.fn();

  beforeEach(() => {
    getNodeEvents.mockReset();
    TestBed.configureTestingModule({
      declarations: [ResourceUsageVisualizationComponent],
      providers: [{
        provide: DataService,
        useValue: { restClient: { getNodeEvents } }
      }]
    }).overrideComponent(ResourceUsageVisualizationComponent, { set: { template: '' } });
  });

  it('does not load resource usage after destruction', () => {
    const fixture = TestBed.createComponent(ResourceUsageVisualizationComponent);
    const component = fixture.componentInstance;

    fixture.destroy();
    component.update({
      listEventStoreData: [{
        eventsList: {},
        type: 'Node',
        displayName: '_nt_0'
      }],
      startDate: new Date(0),
      endDate: new Date(1)
    });

    expect(getNodeEvents).not.toHaveBeenCalled();
  });

  it('reuses an identical in-flight date-window request', () => {
    const firstRequest = new Subject<NodeEvent[]>();
    const secondRequest = new Subject<NodeEvent[]>();
    getNodeEvents
      .mockReturnValueOnce(firstRequest)
      .mockReturnValueOnce(secondRequest);
    const fixture = TestBed.createComponent(ResourceUsageVisualizationComponent);
    const component = fixture.componentInstance;
    const update = {
      listEventStoreData: [{
        eventsList: {},
        type: 'Node' as const,
        displayName: '_nt_0'
      }],
      startDate: new Date(0),
      endDate: new Date(1)
    };

    component.update(update);
    component.update(update);

    expect(getNodeEvents).toHaveBeenCalledOnce();
    expect(firstRequest.observers).toHaveLength(1);

    firstRequest.complete();
    component.update(update);
    expect(getNodeEvents).toHaveBeenCalledTimes(2);
    expect(secondRequest.observers).toHaveLength(1);
    fixture.destroy();
  });
});
