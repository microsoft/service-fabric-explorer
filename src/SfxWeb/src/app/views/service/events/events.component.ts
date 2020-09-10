import { Component, OnInit, Injector } from '@angular/core';
import { ServiceBaseController } from '../ServiceBase';
import { DataService } from 'src/app/services/data.service';
import { ServiceEventList } from 'src/app/Models/DataModels/collections/Collections';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent extends ServiceBaseController {

  serviceEvents: ServiceEventList;

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  setup() {
    this.serviceEvents = this.data.createServiceEventList(this.serviceId);
  }

}
