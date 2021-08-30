import { Component, OnInit, Input, OnChanges, OnDestroy } from '@angular/core';
import { IRawReplicatorStatus, IRawRemoteReplicatorStatus } from 'src/app/Models/RawDataTypes';
import { ReplicaOnPartition } from 'src/app/Models/DataModels/Replica';
import { Utils } from 'src/app/Utils/Utils';
import { Subscription } from 'rxjs';
import { IEssentialListItem } from '../../charts/essential-health-tile/essential-health-tile.component';

@Component({
  selector: 'app-replica-status-container',
  templateUrl: './replica-status-container.component.html',
  styleUrls: ['./replica-status-container.component.scss']
})
export class ReplicaStatusContainerComponent implements OnChanges, OnDestroy {

  @Input() replicas: ReplicaOnPartition[];
  sortedReplicas = [];

  replicatorData: IRawReplicatorStatus;
  replicaDict = {};
  primaryReplica: ReplicaOnPartition;
  queueSize = '';

  overviewItems: IEssentialListItem[] = [];
  essentialItems: IEssentialListItem[] = [];

  sub: Subscription = new Subscription();

  constructor() { }

  ngOnChanges(): void {
    this.replicas.forEach(replica => {
      if (replica.raw.ReplicaRole === 'Primary') {
        this.primaryReplica = replica;
        // console.log(this.primaryReplica.)
      }
    });
    // wrap check given primary starts as null
    if (this.primaryReplica) {
      this.sub.add(this.primaryReplica.detail.refresh().subscribe(() => {

        this.queueSize = Utils.getFriendlyFileSize(+this.primaryReplica.detail.raw.ReplicatorStatus.ReplicationQueueStatus.QueueMemorySize);

        this.replicatorData = this.primaryReplica.detail.raw.ReplicatorStatus;
        this.replicatorData.RemoteReplicators.sort( a => a.IsInBuild ? -1 : 1 );

        this.replicaDict = this.replicatorData.RemoteReplicators.reduce(( (data, replica) => {data[replica.ReplicaId] = replica; return data; }), {});
        this.sortedReplicas = this.replicas.sort( (a,b) => a.replicaRoleSortPriority - b.replicaRoleSortPriority);
        // this.replicaDict = this.replicas.reduce(( (data, replica) => {data[replica.id] = replica; return data; }), {});
        const ref = this.primaryReplica.detail.replicatorStatus.raw.ReplicationQueueStatus;

        this.overviewItems = [
          {
            descriptionName: 'Queue Utilization Percentage',
            copyTextValue: ref.QueueUtilizationPercentage,
            displayText: ref.QueueUtilizationPercentage + '%',
          },
          {
            descriptionName: 'Queue Memory Size',
            copyTextValue: this.queueSize,
            displayText: this.queueSize,
          },
        ]

        this.essentialItems = [
          {
            descriptionName: 'Last Sequence Number(LSN) ',
            copyTextValue: ref.LastSequenceNumber,
            displayText: ref.LastSequenceNumber,
          },
          {
            descriptionName: 'Completed Sequence Number',
            copyTextValue: ref.CompletedSequenceNumber,
            displayText: ref.CompletedSequenceNumber,
          },
          {
            descriptionName: 'Committed Sequence Number',
            copyTextValue: ref.CommittedSequenceNumber,
            displayText: ref.CommittedSequenceNumber,
          },
        ];
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
