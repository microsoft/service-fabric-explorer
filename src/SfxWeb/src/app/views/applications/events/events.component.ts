import { Component, OnInit, Injector } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';
import { IResponseMessageHandler, EventsStoreResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { IEventStoreData } from 'src/app/modules/event-store/event-store/event-store.component';
import { IOptionConfig } from 'src/app/modules/event-store/option-picker/option-picker.component';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent extends BaseControllerDirective {

  listEventStoreData: IEventStoreData<any, any> [];
  optionsConfig: IOptionConfig;

  constructor(private data: DataService, injector: Injector) {
    super(injector);
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
