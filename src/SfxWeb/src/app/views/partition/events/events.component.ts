import { Component, OnInit, Injector } from '@angular/core';
import { PartitionBaseControllerDirective } from '../PartitionBase';
import { DataService } from 'src/app/services/data.service';
import { PartitionTimelineGenerator } from 'src/app/Models/eventstore/timelineGenerators';
import { IEventStoreData } from 'src/app/modules/event-store/event-store/event-store.component';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent extends PartitionBaseControllerDirective {

  listEventStoreData: IEventStoreData [];

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  setup() {
    this.listEventStoreData = [{
      eventsList: this.data.createPartitionEventList(this.partitionId),
      timelineGenerator: new PartitionTimelineGenerator(),
      displayName: 'Partition: ' + this.partitionId
    }];
  }

}
