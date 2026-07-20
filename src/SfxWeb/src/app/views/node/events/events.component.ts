import { Component, OnInit, inject } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { NodeBaseControllerDirective } from '../NodeBase';
import { IEventStoreData } from 'src/app/modules/event-store/event-store/event-store.component';
import { IOptionConfig } from 'src/app/modules/event-store/option-picker/option-picker.component';

@Component({
    selector: 'app-node-events',
    templateUrl: './events.component.html',
    styleUrls: ['./events.component.scss'],
    standalone: false
})
export class EventsComponent extends NodeBaseControllerDirective {
  protected data: DataService = inject(DataService);


  listEventStoreData: IEventStoreData<any, any> [];
  optionsConfig: IOptionConfig;

  setup() {
    this.listEventStoreData = [
      this.data.getNodeEventData(this.nodeName)
    ];

    this.optionsConfig = {
      enableCluster: true,
      enableRepairTasks: true
    };
  }

}
