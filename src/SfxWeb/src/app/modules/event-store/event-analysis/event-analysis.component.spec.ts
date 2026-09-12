import { EventAnalysisComponent } from './event-analysis.component';
import { RelatedEventsConfigs } from 'src/app/Models/eventstore/RelatedEventsConfigs';
import { IConcurrentEvents } from 'src/app/Models/eventstore/rcaEngine';

describe('EventAnalysisComponent', () => {
  it('distinguishes unsupported events from supported scenarios', () => {
    const component = new EventAnalysisComponent();
    component.events = [{ kind: 'NotSupported' } as IConcurrentEvents];
    component.ngOnChanges();
    expect(component.supportedEvents.length).toBe(0);
    component.events = [{ kind: RelatedEventsConfigs[0].eventType, reason: null } as IConcurrentEvents];
    component.ngOnChanges();
    expect(component.supportedEvents.length).toBe(1);
  });
  it('passes original explanations to the shared RCA summary', () => {
    const component = new EventAnalysisComponent();
    const event = { kind: RelatedEventsConfigs[0].eventType, reasonForEvent: 'Related activity' } as IConcurrentEvents;
    event.reason = event;
    component.events = [event]; component.ngOnChanges();
    expect(component.supportedEvents[0]).toBe(event);
    event.reason = { name: 'self', reason: null } as IConcurrentEvents;
    component.ngOnChanges();
    expect(component.supportedEvents[0].reason).toBe(event.reason);
  });
});
