import { Component, OnInit } from '@angular/core';
import { ClusterTimelineGenerator, NodeTimelineGenerator } from 'src/app/Models/eventstore/timelineGenerators';
import { IEventStoreData } from 'src/app/modules/event-store/event-store/event-store.component';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent implements OnInit {

  listEventStoreData : IEventStoreData [];

  constructor(public data : DataService) { }

  ngOnInit(): void {
    this.listEventStoreData = [
      { eventsList : this.data.createClusterEventList(), 
        timelineGenerator: new ClusterTimelineGenerator(),
        displayName : "Clusters"
      },
      { eventsList : this.data.createNodeEventList(null), 
        timelineGenerator : new NodeTimelineGenerator(),
        displayName : "Nodes"
      }
    ];
  }

}
