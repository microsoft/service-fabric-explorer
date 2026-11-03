import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
import { FabricProcessResourceUsageCapabilityService } from 'src/app/services/fabric-process-resource-usage-capability.service';
import { MessageService } from 'src/app/services/message.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { EventsComponent } from './events.component';
import { ResourceUsageVisualizationComponent } from './resource-usage-visualization.component';

describe('Node EventsComponent', () => {
  function createComponent(
    isSupported: boolean,
    ensureSupported = vi.fn().mockReturnValue(of(isSupported))
  ) {
    const capability = { canRetry: false, ensureSupported };
    const getNodeEventData = vi.fn().mockReturnValue({});

    TestBed.configureTestingModule({
      declarations: [EventsComponent],
      providers: [
        { provide: DataService, useValue: { getNodeEventData } },
        { provide: FabricProcessResourceUsageCapabilityService, useValue: capability },
        { provide: ActivatedRoute, useValue: {} },
        { provide: Router, useValue: {} },
        { provide: RefreshService, useValue: {} },
        { provide: MessageService, useValue: {} }
      ]
    }).overrideComponent(EventsComponent, { set: { template: '' } });

    const component = TestBed.createComponent(EventsComponent).componentInstance;
    component.nodeName = '_Node_0';
    component.setup();

    return { component, capability, ensureSupported, getNodeEventData };
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

  it('retries capability detection on a later page refresh when due', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const ensureSupported = vi.fn()
      .mockReturnValueOnce(throwError(() => new Error('EventStore unavailable')))
      .mockReturnValueOnce(of(true));
    const { component, capability } = createComponent(false, ensureSupported);
    capability.canRetry = true;

    try {
      component.refresh().subscribe();

      expect(ensureSupported).toHaveBeenCalledTimes(2);
      expect(component.vizRefs.map(ref => ref.component)).toContain(ResourceUsageVisualizationComponent);
    } finally {
      consoleError.mockRestore();
    }
  });
});
