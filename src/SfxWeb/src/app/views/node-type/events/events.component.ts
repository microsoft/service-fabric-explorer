import { Component, Injector, OnInit } from '@angular/core';
import { IEventStoreData } from 'src/app/modules/event-store/event-store/event-store.component';
import { IOptionConfig } from 'src/app/modules/event-store/option-picker/option-picker.component';
import { DataService } from 'src/app/services/data.service';
import { NodeTypeBaseControllerDirective } from '../NodeTypeBase';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent extends NodeTypeBaseControllerDirective {

  listEventStoreData: IEventStoreData<any, any> [];
  optionsConfig: IOptionConfig;

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  setup() {
    this.listEventStoreData = [
      this.data.getNodeEventData(),
    ];

    this.optionsConfig = {
      enableCluster: true,
      enableRepairTasks: true
    };
  }

}
