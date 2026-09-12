import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, EventEmitter, Output, ChangeDetectionStrategy } from '@angular/core';
import { IConcurrentEvents } from 'src/app/Models/eventstore/rcaEngine';
import { RelatedEventsConfigs } from 'src/app/Models/eventstore/RelatedEventsConfigs';
import { ConcurrentEventsVisualizationModule } from '../../concurrent-events-visualization/concurrent-events-visualization.module';

@Component({
  selector: 'app-event-analysis', standalone: true, imports: [CommonModule, ConcurrentEventsVisualizationModule],
  templateUrl: './event-analysis.component.html', styleUrls: ['./event-analysis.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventAnalysisComponent implements OnChanges {
  @Input() events: IConcurrentEvents[] = [];
  @Input() loading = false;
  @Input() failed = false;
  @Output() selectEvent = new EventEmitter<string>();
  public supportedEvents: IConcurrentEvents[] = [];
  ngOnChanges() {
    this.supportedEvents = this.events.filter(event => RelatedEventsConfigs.some(config => config.eventType === event.kind));
  }
}
