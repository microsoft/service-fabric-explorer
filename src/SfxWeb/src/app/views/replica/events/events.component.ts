import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { ReplicaBaseControllerDirective } from '../ReplicaBase';
import { DataService } from 'src/app/services/data.service';
import { IEventStoreData } from 'src/app/modules/event-store/event-store/event-store.component';

@Component({
    selector: 'app-replica-events',
    templateUrl: './events.component.html',
    styleUrls: ['./events.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class EventsComponent extends ReplicaBaseControllerDirective {
  protected data: DataService = inject(DataService);


  listEventStoreData: IEventStoreData<any, any> [];

  setup() {
    this.listEventStoreData = [
      this.data.getReplicaEventData(this.partitionId, this.replicaId)
    ];
  }

}
