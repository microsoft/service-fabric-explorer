import { Component, OnInit, Injector } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';
import { IResponseMessageHandler, EventsStoreResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { IEventStoreData } from 'src/app/modules/event-store/event-store/event-store.component';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent extends BaseControllerDirective {

  listEventStoreData: IEventStoreData<any, any> [];

  constructor(private data: DataService, injector: Injector) {
    super(injector);
   }

   setup() {
    this.listEventStoreData = [
      this.data.getApplicationEventData()
    ];
   }

   refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return this.listEventStoreData[0].eventsList.refresh(new EventsStoreResponseMessageHandler(messageHandler));
  }
}
