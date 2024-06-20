import { Component, Injector } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { IEventStoreData } from 'src/app/modules/event-store/event-store/event-store.component';
import { IOptionConfig } from 'src/app/modules/event-store/option-picker/option-picker.component';
import { ApplicationsBaseControllerDirective } from '../applicationsBase';

@Component({
  selector: 'app-apps-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent extends ApplicationsBaseControllerDirective {

  listEventStoreData: IEventStoreData<any, any> [];
  optionsConfig: IOptionConfig;

  constructor(data: DataService, injector: Injector) {
    super(data, injector);
   }

   setup() {
    this.listEventStoreData = [
      this.data.getApplicationEventData()
    ];

    this.optionsConfig = {
      enableCluster: true,
      enableNodes: true,
      enableRepairTasks: true
    };
   }
}
