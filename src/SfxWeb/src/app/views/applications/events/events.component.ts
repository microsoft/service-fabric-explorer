import { Component, OnInit, Injector } from '@angular/core';
import { ApplicationEventList } from 'src/app/Models/DataModels/collections/Collections';
import { DataService } from 'src/app/services/data.service';
import { BaseController } from 'src/app/ViewModels/BaseController';
import { IResponseMessageHandler, EventsStoreResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent extends BaseController {

  appEvents: ApplicationEventList;

  constructor(private data: DataService, injector: Injector) {
    super(injector);
   }

   setup() {
    this.appEvents = this.data.createApplicationEventList(null);
   }

   refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return this.appEvents.refresh(new EventsStoreResponseMessageHandler(messageHandler));
  }
}
