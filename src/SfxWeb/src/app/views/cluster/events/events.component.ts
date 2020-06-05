import { Component, OnInit } from '@angular/core';
import { ClusterEventList } from 'src/app/Models/DataModels/collections/Collections';
import { ClusterTimelineGenerator } from 'src/app/Models/eventstore/timelineGenerators';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent implements OnInit {

  clusterEvents: ClusterEventList;
  clusterTimelineGenerator: ClusterTimelineGenerator;

  constructor(public data: DataService) { }

  ngOnInit() {
    this.clusterEvents = this.data.createClusterEventList();
    this.clusterTimelineGenerator = new ClusterTimelineGenerator();
  }

}
