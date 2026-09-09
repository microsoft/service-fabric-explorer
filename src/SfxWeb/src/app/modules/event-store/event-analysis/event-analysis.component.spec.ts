import { EventAnalysisComponent } from './event-analysis.component';
import { RelatedEventsConfigs } from 'src/app/Models/eventstore/RelatedEventsConfigs';
import { IConcurrentEvents } from 'src/app/Models/eventstore/rcaEngine';

describe('EventAnalysisComponent', () => {
  it('distinguishes unsupported events from supported scenarios', () => {
    const component = new EventAnalysisComponent();
    component.events = [{ kind: 'NotSupported' } as IConcurrentEvents];
    component.ngOnChanges();
    expect(component.scenarios.length).toBe(0);
    component.events = [{ kind: RelatedEventsConfigs[0].eventType, reason: null } as IConcurrentEvents];
    component.ngOnChanges();
    expect(component.scenarios.length).toBe(1);
    expect(component.explained).toBe(0);
  });
  it('handles recursive and self explanations without infinite traversal', () => {
    const component = new EventAnalysisComponent();
    const event = { kind: RelatedEventsConfigs[0].eventType, reasonForEvent: 'Related activity' } as IConcurrentEvents;
    event.reason = event;
    component.events = [event]; component.ngOnChanges();
    expect(component.scenarios[0].steps.length).toBe(1);
    expect(component.explained).toBe(1);
    event.reason = { name: 'self', reason: null } as IConcurrentEvents;
    component.ngOnChanges();
    expect(component.scenarios[0].steps.length).toBe(1);
  });
});
