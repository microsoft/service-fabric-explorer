import { Component, OnInit, Injector } from '@angular/core';
import { ApplicationBaseControllerDirective } from '../applicationBase';
import { DataService } from 'src/app/services/data.service';
import { IEventStoreData } from 'src/app/modules/event-store/event-store/event-store.component';
import { IOptionConfig } from 'src/app/modules/event-store/option-picker/option-picker.component';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent extends ApplicationBaseControllerDirective {

  listEventStoreData: IEventStoreData<any, any> [];
  visEventStoreData: IEventStoreData<any, any> [];
  optionsConfig: IOptionConfig;

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  setup() {    
    // grab event data for all nodes for concurrent events visualization tool    
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
