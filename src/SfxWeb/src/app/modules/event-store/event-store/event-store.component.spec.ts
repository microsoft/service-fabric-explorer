import { QueryList, Type, ViewContainerRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
import { VisualizationDirective } from '../visualization.directive';
import { VisualizationComponent } from '../visualizationComponents';
import { EventStoreComponent, VisReference } from './event-store.component';

class TestVisualizationComponent implements VisualizationComponent {
  update = vi.fn();
}

describe('EventStoreComponent', () => {
  function createVisualizationDirective(instance: VisualizationComponent) {
    const directive = TestBed.runInInjectionContext(() => new VisualizationDirective());
    const createComponent = vi.fn().mockReturnValue({ instance });
    directive.viewContainerRef = {
      clear: vi.fn(),
      createComponent
    } as unknown as ViewContainerRef;

    return { directive, createComponent };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EventStoreComponent],
      providers: [
        { provide: DataService, useValue: {} },
        { provide: ViewContainerRef, useValue: {} }
      ]
    }).overrideComponent(EventStoreComponent, { set: { template: '' } });
  });

  it('initializes a visualization added after the date window is ready', async () => {
    const component = TestBed.createComponent(EventStoreComponent).componentInstance;
    const timeline = new TestVisualizationComponent();
    const resourceUsage = new TestVisualizationComponent();
    const rca = new TestVisualizationComponent();
    const timelineDirective = createVisualizationDirective(timeline);
    const resourceUsageDirective = createVisualizationDirective(resourceUsage);
    const rcaDirective = createVisualizationDirective(rca);
    const vizDirs = new QueryList<VisualizationDirective>();
    const timelineRef: VisReference = {
      name: 'Timeline',
      component: TestVisualizationComponent as Type<VisualizationComponent>
    };
    const resourceUsageRef: VisReference = {
      name: 'Resource Usage',
      component: TestVisualizationComponent as Type<VisualizationComponent>
    };
    const rcaRef: VisReference = {
      name: 'RCA',
      component: TestVisualizationComponent as Type<VisualizationComponent>
    };

    component.vizRefs = [timelineRef, rcaRef];
    component.listEventStoreData = [{
      displayName: 'Nodes',
      eventsList: { refresh: vi.fn().mockReturnValue(of(true)) }
    }];
    component.vizDirs = vizDirs;
    vizDirs.reset([timelineDirective.directive, rcaDirective.directive]);
    component.ngAfterViewInit();
    component.setDate({ startDate: new Date(0), endDate: new Date(1) });
    await new Promise<void>(resolve => queueMicrotask(resolve));

    component.vizRefs = [timelineRef, resourceUsageRef, rcaRef];
    vizDirs.reset([timelineDirective.directive, resourceUsageDirective.directive, rcaDirective.directive]);
    vizDirs.notifyOnChanges();
    component.update();

    expect(resourceUsageDirective.createComponent).toHaveBeenCalledOnce();
    expect(resourceUsage.update).toHaveBeenCalledTimes(2);
    expect(rcaDirective.createComponent).toHaveBeenCalledOnce();
    expect(rca.update).toHaveBeenCalledTimes(3);
  });
});
