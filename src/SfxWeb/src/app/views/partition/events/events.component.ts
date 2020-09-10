import { Component, OnInit, Injector } from '@angular/core';
import { PartitionBaseController } from '../PartitionBase';
import { DataService } from 'src/app/services/data.service';
import { PartitionEventList } from 'src/app/Models/DataModels/collections/Collections';
import { PartitionTimelineGenerator } from 'src/app/Models/eventstore/timelineGenerators';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent extends PartitionBaseController {
  partitionEvents: PartitionEventList;
  partitionTimeLineGenerator: PartitionTimelineGenerator;

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  setup() {
    this.partitionEvents = this.data.createPartitionEventList(this.partitionId);
    this.partitionTimeLineGenerator = new PartitionTimelineGenerator();
  }
}
