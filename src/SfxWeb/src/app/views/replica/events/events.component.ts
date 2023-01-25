import { Component, Injector } from '@angular/core';
import { ReplicaBaseControllerDirective } from '../ReplicaBase';
import { DataService } from 'src/app/services/data.service';
import { EventChip } from 'src/app/modules/event-store/event-chip/event-chip.component';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent extends ReplicaBaseControllerDirective {

  listEventStoreChips: EventChip[];

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  setup() {
    this.listEventStoreChips = [
      {
        name: '',
        type: 'Replica',
        id: this.replicaId,
        partitionId: this.partitionId,
        eventsFilter: '' 
      }
    ];
  }

}
