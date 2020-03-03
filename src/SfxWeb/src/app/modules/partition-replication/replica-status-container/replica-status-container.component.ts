import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { IRawReplicatorStatus, IRawRemoteReplicatorStatus } from 'src/app/Models/RawDataTypes';

@Component({
  selector: 'app-replica-status-container',
  templateUrl: './replica-status-container.component.html',
  styleUrls: ['./replica-status-container.component.scss']
})
export class ReplicaStatusContainerComponent implements OnChanges {

  @Input() replicatorData: IRawReplicatorStatus;

  constructor() { }

  ngOnChanges(): void {
    this.replicatorData.RemoteReplicators.sort( (a,b) => a.IsInBuild ? -1 : 1 );
  }


  trackByFn(index, replicaStatus: IRawRemoteReplicatorStatus) {
    return replicaStatus.ReplicaId;
  }
}
