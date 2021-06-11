import { Component, OnInit } from '@angular/core';
import { ClusterTimelineGenerator } from 'src/app/Models/eventstore/timelineGenerators';
import { DataService } from 'src/app/services/data.service';
import { IEventStoreData } from 'src/app/modules/event-store/event-store/event-store.component';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent implements OnInit {

  listEventStoreData: IEventStoreData [];

  constructor(public data: DataService) { }

  ngOnInit() {
    this.listEventStoreData = [{
      eventsList: this.data.createClusterEventList(),
      timelineGenerator: new ClusterTimelineGenerator(),
      displayName: 'Cluster'
    }];
  }

}
