import { Component, OnInit, Injector } from '@angular/core';
import { ReplicaBaseController } from '../ReplicaBase';
import { DataService } from 'src/app/services/data.service';
import { ReplicaEventList } from 'src/app/Models/DataModels/collections/Collections';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent extends ReplicaBaseController {

  replicaEvents: ReplicaEventList;

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  setup() {
    this.replicaEvents = this.data.createReplicaEventList(this.partitionId, this.replicaId);
  }

}
