import { Component, Injector } from '@angular/core';
import { PartitionBaseControllerDirective } from '../PartitionBase';
import { DataService } from 'src/app/services/data.service';
import { EventChip } from 'src/app/modules/event-store/event-chip/event-chip.component';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent extends PartitionBaseControllerDirective {

  listEventStoreChips: EventChip[];

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  setup() {
    this.listEventStoreChips = [
      {
        name: '',
        type: 'Partition',
        id: this.partitionId,
        eventsFilter: '' 
      }
    ];
  }

}
