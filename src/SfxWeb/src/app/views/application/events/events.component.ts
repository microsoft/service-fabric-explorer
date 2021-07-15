import { Component, OnInit, Injector } from '@angular/core';
import { ApplicationBaseControllerDirective } from '../applicationBase';
import { DataService } from 'src/app/services/data.service';
import { ApplicationTimelineGenerator } from 'src/app/Models/eventstore/timelineGenerators';
import { IEventStoreData } from 'src/app/modules/event-store/event-store/event-store.component';
import { IOptionConfig } from 'src/app/modules/event-store/option-picker/option-picker.component';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent extends ApplicationBaseControllerDirective {

  listEventStoreData: IEventStoreData<any, any> [];
  optionsConfig: IOptionConfig;

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  setup() {
    this.listEventStoreData = [
      this.data.getApplicationEventData(this.appId)
    ];

    this.optionsConfig = {
      enableCluster: true,
      enableNodes: true,
      enableRepairTasks: true
    };
  }

}
