import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
import { FabricProcessResourceUsageCapabilityService } from 'src/app/services/fabric-process-resource-usage-capability.service';
import { SettingsService } from 'src/app/services/settings.service';
import { EventsComponent } from './events.component';
import { ClusterResourceUsageVisualizationComponent } from './resource-usage-visualization.component';
import { RefreshService } from 'src/app/services/refresh.service';

describe('Nodes EventsComponent', () => {
  function createComponent(
    isSupported: boolean,
    ensureSupported = vi.fn().mockReturnValue(of(isSupported))
  ) {
    const capability = { canRetry: false, ensureSupported };
    const getNodeEventData = vi.fn().mockReturnValue({});
    const refreshSubject = new Subject<void>();

    TestBed.configureTestingModule({
      declarations: [EventsComponent],
      providers: [
        { provide: DataService, useValue: { getNodeEventData } },
        { provide: SettingsService, useValue: {} },
        { provide: FabricProcessResourceUsageCapabilityService, useValue: capability },
        { provide: RefreshService, useValue: { refreshSubject } }
      ]
    }).overrideComponent(EventsComponent, { set: { template: '' } });

    const component = TestBed.createComponent(EventsComponent).componentInstance;
    component.ngOnInit();

    return { component, capability, ensureSupported, refreshSubject };
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

  it('retries capability detection on a later page refresh when due', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const ensureSupported = vi.fn()
      .mockReturnValueOnce(throwError(() => new Error('EventStore unavailable')))
      .mockReturnValueOnce(of(true));
    const { component, capability, refreshSubject } = createComponent(false, ensureSupported);
    capability.canRetry = true;

    try {
      refreshSubject.next();

      expect(ensureSupported).toHaveBeenCalledTimes(2);
      expect(component.vizRefs.map(ref => ref.component)).toContain(ClusterResourceUsageVisualizationComponent);
    } finally {
      component.ngOnDestroy();
      consoleError.mockRestore();
    }
  });
});
