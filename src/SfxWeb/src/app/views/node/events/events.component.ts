import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { NodeBaseControllerDirective } from '../NodeBase';
import { IEventStoreData } from 'src/app/modules/event-store/event-store/event-store.component';

@Component({
    selector: 'app-node-events',
    templateUrl: './events.component.html',
    styleUrls: ['./events.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class EventsComponent extends NodeBaseControllerDirective {
  protected data: DataService = inject(DataService);


  listEventStoreData!: IEventStoreData<any, any> [];

  setup() {
    this.listEventStoreData = [
      this.data.getNodeThrottlingEventData(this.nodeName)
    ];
  }

}
