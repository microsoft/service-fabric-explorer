import { Component, Input, OnChanges, ChangeDetectionStrategy, inject } from '@angular/core';
import { IConcurrentEvents } from 'src/app/Models/eventstore/rcaEngine';
import { RelatedEventsConfigs } from 'src/app/Models/eventstore/RelatedEventsConfigs';
import { Utils } from 'src/app/Utils/Utils';
import { ExperienceService } from 'src/app/services/experience.service';

@Component({
    selector: 'app-rca-summary',
    templateUrl: './rca-summary.component.html',
    styleUrls: ['./rca-summary.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class RcaSummaryComponent implements OnChanges {
  public experience = inject(ExperienceService);

  @Input() events: IConcurrentEvents[] = [];

  data: Record<string, IConcurrentEvents[]> = {};
  constructor() { }

  ngOnChanges(): void {
    const explained = this.events.filter(event => RelatedEventsConfigs.some(config => config.eventType === event.kind));
    this.data = Utils.groupByFunc<IConcurrentEvents>(explained, item => item.kind);
  }
}
