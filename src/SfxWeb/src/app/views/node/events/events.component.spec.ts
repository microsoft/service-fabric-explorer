import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
import { FabricProcessResourceUsageCapabilityService } from 'src/app/services/fabric-process-resource-usage-capability.service';
import { MessageService } from 'src/app/services/message.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { EventsComponent } from './events.component';
import { ResourceUsageVisualizationComponent } from './resource-usage-visualization.component';

describe('Node EventsComponent', () => {
  function createComponent(isSupported: boolean) {
    const ensureSupported = vi.fn().mockReturnValue(of(isSupported));
    const getNodeEventData = vi.fn().mockReturnValue({});

    TestBed.configureTestingModule({
      declarations: [EventsComponent],
      providers: [
        { provide: DataService, useValue: { getNodeEventData } },
        { provide: FabricProcessResourceUsageCapabilityService, useValue: { ensureSupported } },
        { provide: ActivatedRoute, useValue: {} },
        { provide: Router, useValue: {} },
        { provide: RefreshService, useValue: {} },
        { provide: MessageService, useValue: {} }
      ]
    }).overrideComponent(EventsComponent, { set: { template: '' } });

    const component = TestBed.createComponent(EventsComponent).componentInstance;
    component.nodeName = '_Node_0';
    component.setup();

    return { component, ensureSupported, getNodeEventData };
  }

  it('omits resource usage when the runtime does not support the event', () => {
    const { component, ensureSupported } = createComponent(false);

    expect(ensureSupported).toHaveBeenCalledOnce();
    expect(component.vizRefs.map(ref => ref.component)).not.toContain(ResourceUsageVisualizationComponent);
  });

  it('adds exactly one resource usage visualization when supported', () => {
    const { component } = createComponent(true);

    expect(component.vizRefs.filter(ref => ref.component === ResourceUsageVisualizationComponent)).toHaveLength(1);

    component.setup();

    expect(component.vizRefs.filter(ref => ref.component === ResourceUsageVisualizationComponent)).toHaveLength(1);
  });
});
