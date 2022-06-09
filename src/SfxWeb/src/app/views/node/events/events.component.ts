import { Component, OnInit, Injector, Input } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { NodeBaseControllerDirective } from '../NodeBase';
import { IEventStoreData } from 'src/app/modules/event-store/event-store/event-store.component';
import { IOptionConfig } from 'src/app/modules/event-store/option-picker/option-picker.component';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent extends NodeBaseControllerDirective {

  listEventStoreData: IEventStoreData<any, any> [];
  optionsConfig: IOptionConfig;
  @Input() isEventListShown = true;

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  setup() {
    this.listEventStoreData = [
      this.data.getNodeEventData(this.nodeName),
      this.data.getClusterEventData(),
    ];

    this.optionsConfig = {
      enableCluster: true,
      enableRepairTasks: true
    };
  }

}
