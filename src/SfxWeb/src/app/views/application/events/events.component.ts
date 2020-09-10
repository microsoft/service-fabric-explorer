import { Component, OnInit, Injector } from '@angular/core';
import { ApplicationBaseController } from '../applicationBase';
import { DataService } from 'src/app/services/data.service';
import { ApplicationEventList } from 'src/app/Models/DataModels/collections/Collections';
import { ApplicationTimelineGenerator } from 'src/app/Models/eventstore/timelineGenerators';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent extends ApplicationBaseController {

  timelineGenerator: ApplicationTimelineGenerator;
  appEvents: ApplicationEventList;

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  setup() {
    this.appEvents = this.data.createApplicationEventList(this.appId);
    this.timelineGenerator = new ApplicationTimelineGenerator();
  }


}
