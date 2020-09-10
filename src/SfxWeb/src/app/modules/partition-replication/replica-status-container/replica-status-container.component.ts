import { Component, OnInit, Input, OnChanges, OnDestroy } from '@angular/core';
import { IRawReplicatorStatus, IRawRemoteReplicatorStatus } from 'src/app/Models/RawDataTypes';
import { ReplicaOnPartition } from 'src/app/Models/DataModels/Replica';
import { Utils } from 'src/app/Utils/Utils';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-replica-status-container',
  templateUrl: './replica-status-container.component.html',
  styleUrls: ['./replica-status-container.component.scss']
})
export class ReplicaStatusContainerComponent implements OnChanges, OnDestroy {

  @Input() replicas: ReplicaOnPartition[];

  replicatorData: IRawReplicatorStatus;
  replicaDict = {};
  primaryReplica: ReplicaOnPartition;
  queueSize = '';

  sub: Subscription = new Subscription();

  constructor() { }

  ngOnChanges(): void {
    this.replicas.forEach(replica => {
      if (replica.raw.ReplicaRole === 'Primary') {
        this.primaryReplica = replica;
      }
    });
    // wrap check given primary starts as null
    if (this.primaryReplica) {
      this.sub.add(this.primaryReplica.detail.refresh().subscribe(() => {

        this.queueSize = Utils.getFriendlyFileSize(+this.primaryReplica.detail.raw.ReplicatorStatus.ReplicationQueueStatus.QueueMemorySize);

        this.replicatorData = this.primaryReplica.detail.raw.ReplicatorStatus;
        this.replicatorData.RemoteReplicators.sort( a => a.IsInBuild ? -1 : 1 );

        this.replicaDict = this.replicas.reduce(( (data, replica) => {data[replica.id] = replica; return data; }), {});
      }));
    }

  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  trackByFn(index, replicaStatus: IRawRemoteReplicatorStatus) {
    return replicaStatus.ReplicaId;
  }
}
