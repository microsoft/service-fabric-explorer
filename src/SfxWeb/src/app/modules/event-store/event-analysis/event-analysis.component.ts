import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, EventEmitter, Output, ChangeDetectionStrategy } from '@angular/core';
import { IConcurrentEvents } from 'src/app/Models/eventstore/rcaEngine';
import { RelatedEventsConfigs } from 'src/app/Models/eventstore/RelatedEventsConfigs';

@Component({
  selector: 'app-event-analysis', standalone: true, imports: [CommonModule],
  templateUrl: './event-analysis.component.html', styleUrls: ['./event-analysis.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventAnalysisComponent implements OnChanges {
  @Input() events: IConcurrentEvents[] = [];
  @Input() loading = false;
  @Input() failed = false;
  @Output() selectEvent = new EventEmitter<string>();
  public scenarios: { event: IConcurrentEvents; steps: { name: string; explanation: string }[] }[] = [];
  public explained = 0;
  ngOnChanges() {
    this.scenarios = this.events.filter(event => RelatedEventsConfigs.some(config => config.eventType === event.kind)).map(event => {
      const steps: { name: string; explanation: string }[] = [];
      const seen = new Set<IConcurrentEvents>();
      let current: IConcurrentEvents | null | undefined = event;
      while (current && !seen.has(current) && current.name !== 'self') {
        seen.add(current);
        steps.push({ name: this.name(current.kind || current.name || 'Event'), explanation: current.reasonForEvent || '' });
        current = current.reason;
      }
      return { event, steps };
    });
    this.explained = this.scenarios.filter(item => !!item.event.reason).length;
  }
  public name(value: string) { return value.replace(/([a-z0-9])([A-Z])/g, '$1 $2'); }
}
