import { Component, OnInit, Injector } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { NodeBaseController } from '../NodeBase';
import { NodeTimelineGenerator } from 'src/app/Models/eventstore/timelineGenerators';
import { NodeEventList } from 'src/app/Models/DataModels/collections/Collections';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent extends NodeBaseController {
  nodeEvents: NodeEventList;
  nodeEventTimelineGenerator: NodeTimelineGenerator;

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  setup() {
    this.nodeEvents = this.data.createNodeEventList(this.nodeName);
    this.nodeEventTimelineGenerator = new NodeTimelineGenerator();
  }

}
