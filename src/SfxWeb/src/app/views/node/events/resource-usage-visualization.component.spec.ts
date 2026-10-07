import { TestBed } from '@angular/core/testing';
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
});
