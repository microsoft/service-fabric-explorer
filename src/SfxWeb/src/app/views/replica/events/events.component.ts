import { Component, OnInit, Injector } from '@angular/core';
import { ReplicaBaseControllerDirective } from '../ReplicaBase';
import { DataService } from 'src/app/services/data.service';
import { IEventStoreData } from 'src/app/modules/event-store/event-store/event-store.component';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent extends ReplicaBaseControllerDirective {

  listEventStoreData: IEventStoreData<any,any> [];

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  setup() {
    this.listEventStoreData = [{
      eventsList: this.data.createReplicaEventList(this.partitionId, this.replicaId),
      displayName: 'Replica: ' + this.replicaId
    }];
  }

}
