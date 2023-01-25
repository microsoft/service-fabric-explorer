import { Component, Injector } from '@angular/core';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';
import { EventChip } from 'src/app/modules/event-store/event-chip/event-chip.component';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent extends BaseControllerDirective {

  listEventStoreChips: EventChip[];

  constructor(injector: Injector) {
    super(injector);
   }

   setup() {
     this.listEventStoreChips = [
      {
        name: '',
        type: 'Application',
        id: '',
        eventsFilter: '' 
      }
    ];
   }
}
