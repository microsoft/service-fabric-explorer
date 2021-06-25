import { Component, OnInit } from '@angular/core';
import { NodeTimelineGenerator } from 'src/app/Models/eventstore/timelineGenerators';
import { DataService } from 'src/app/services/data.service';
import { IEventStoreData } from 'src/app/modules/event-store/event-store/event-store.component';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent implements OnInit {

  listEventStoreData: IEventStoreData<any,any> [];

  constructor(public data: DataService) { }

  ngOnInit() {
    this.listEventStoreData = [{
      eventsList: this.data.createNodeEventList(null),
      timelineGenerator: new NodeTimelineGenerator(),
      displayName: 'Nodes'
    }];
  }

}
