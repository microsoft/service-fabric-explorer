import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
import { FabricProcessResourceUsageCapabilityService } from 'src/app/services/fabric-process-resource-usage-capability.service';
import { SettingsService } from 'src/app/services/settings.service';
import { EventsComponent } from './events.component';
import { ClusterResourceUsageVisualizationComponent } from './resource-usage-visualization.component';

describe('Nodes EventsComponent', () => {
  function createComponent(isSupported: boolean) {
    const ensureSupported = vi.fn().mockReturnValue(of(isSupported));
    const getNodeEventData = vi.fn().mockReturnValue({});

    TestBed.configureTestingModule({
      declarations: [EventsComponent],
      providers: [
        { provide: DataService, useValue: { getNodeEventData } },
        { provide: SettingsService, useValue: {} },
        { provide: FabricProcessResourceUsageCapabilityService, useValue: { ensureSupported } }
      ]
    }).overrideComponent(EventsComponent, { set: { template: '' } });

    const component = TestBed.createComponent(EventsComponent).componentInstance;
    component.ngOnInit();

    return { component, ensureSupported };
  }

  it('omits resource usage when the runtime does not support the event', () => {
    const { component, ensureSupported } = createComponent(false);

    expect(ensureSupported).toHaveBeenCalledOnce();
    expect(component.vizRefs.map(ref => ref.component)).not.toContain(ClusterResourceUsageVisualizationComponent);
  });

  it('adds exactly one resource usage visualization when supported', () => {
    const { component } = createComponent(true);

    expect(component.vizRefs.filter(ref => ref.component === ClusterResourceUsageVisualizationComponent)).toHaveLength(1);
  });
});
