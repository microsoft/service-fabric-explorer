import { Component, Injector } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { NodeBaseControllerDirective } from '../NodeBase';
import { EventChip } from 'src/app/modules/event-store/event-chip/event-chip.component';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent extends NodeBaseControllerDirective {

  listEventStoreChips: EventChip[];

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  setup() {

    const chip = new EventChip();
    chip.type = 'Node';
    chip.id = this.nodeName;

    this.listEventStoreChips = [chip];
  }

}
