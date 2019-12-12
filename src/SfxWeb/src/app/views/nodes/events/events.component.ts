import { Component, OnInit } from '@angular/core';
import { NodeTimelineGenerator } from 'src/app/Models/eventstore/timelineGenerators';
import { NodeEventList } from 'src/app/Models/DataModels/collections/Collections';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent implements OnInit {

  nodeEvents: NodeEventList;
  nodeEventTimelineGenerator: NodeTimelineGenerator;

  constructor(public data: DataService) { }

  ngOnInit() {
      this.nodeEvents = this.data.createNodeEventList(null);
      this.nodeEventTimelineGenerator = new NodeTimelineGenerator();
  }

}
