import { Component, OnInit, Injector } from '@angular/core';
import { ServiceBaseControllerDirective } from '../ServiceBase';
import { DataService } from 'src/app/services/data.service';
import { IEventStoreData } from 'src/app/modules/event-store/event-store/event-store.component';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent extends ServiceBaseControllerDirective {

  listEventStoreData: IEventStoreData [];

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  setup() {
    this.listEventStoreData = [{
      eventsList: this.data.createServiceEventList(this.serviceId),
      displayName: 'Service: ' + this.serviceId
    }];
  }

}
