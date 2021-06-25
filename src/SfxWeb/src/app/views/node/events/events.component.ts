import { Component, OnInit, Injector } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { NodeBaseControllerDirective } from '../NodeBase';
import { NodeTimelineGenerator } from 'src/app/Models/eventstore/timelineGenerators';
import { IEventStoreData } from 'src/app/modules/event-store/event-store/event-store.component';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent extends NodeBaseControllerDirective {

  listEventStoreData: IEventStoreData<any,any> [];

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  setup() {
    this.listEventStoreData = [{
      eventsList: this.data.createNodeEventList(this.nodeName),
      timelineGenerator: new NodeTimelineGenerator(),
      displayName: 'Node: ' + this.nodeName
    }];
  }

}
