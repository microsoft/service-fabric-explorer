import { Component, OnInit, Input, OnChanges, OnDestroy } from '@angular/core';
import { IRawReplicatorStatus, IRawRemoteReplicatorStatus } from 'src/app/Models/RawDataTypes';
import { ReplicaOnPartition } from 'src/app/Models/DataModels/Replica';
import { Utils } from 'src/app/Utils/Utils';
import { Subscription } from 'rxjs';
import { IEssentialListItem } from '../../charts/essential-health-tile/essential-health-tile.component';

export interface ITimedReplication extends IRawRemoteReplicatorStatus {
  date: Date;
}


const reduceReplicators = (data, replica) => {
  data[replica.ReplicaId] = replica;
  return data;
};

@Component({
  selector: 'app-replica-status-container',
  templateUrl: './replica-status-container.component.html',
  styleUrls: ['./replica-status-container.component.scss']
})
export class ReplicaStatusContainerComponent implements OnChanges, OnDestroy {

  @Input() replicas: ReplicaOnPartition[];
  sortedReplicas = [];

  replicaDict = {};
  expandedDict = {};
  cachedData: Record<string, ITimedReplication[]> = {};

  primaryReplica: ReplicaOnPartition;

  overviewItems: IEssentialListItem[] = [];
  replicationStatus: IEssentialListItem[] = [];

  sub: Subscription = new Subscription();

  constructor() { }

  ngOnChanges(): void {
    // grab the primary on each reset
    this.replicas.forEach(replica => {
      if (replica.raw.ReplicaRole === 'Primary') {
        this.primaryReplica = replica;
      }
    });

    // wrap check given primary starts as null
    if (this.primaryReplica) {
      this.sub.add(this.primaryReplica.detail.refresh().subscribe(() => {

        const queueSize = Utils.getFriendlyFileSize(+this.primaryReplica.detail.raw.ReplicatorStatus.ReplicationQueueStatus.QueueMemorySize);

        const replicatorData = this.primaryReplica.detail.raw.ReplicatorStatus;

        this.replicaDict = replicatorData.RemoteReplicators.reduce(reduceReplicators, {});

        replicatorData.RemoteReplicators.forEach(replicator => {
          const cacheData = { ...replicator, date: new Date() };

          // only retain last 20 timestamps
          if (!this.cachedData[replicator.ReplicaId]) {
            this.cachedData[replicator.ReplicaId] = [];
          }

          if (this.cachedData[replicator.ReplicaId].length > 20) {
            this.cachedData[replicator.ReplicaId].shift();
          }

          this.cachedData[replicator.ReplicaId].push(cacheData);
        });

        this.sortedReplicas = this.replicas.sort((a, b) => a.replicaRoleSortPriority - b.replicaRoleSortPriority);

        // ref for shorter lines below
        const ref = this.primaryReplica.detail.replicatorStatus.raw.ReplicationQueueStatus;

        this.overviewItems = [
          {
            descriptionName: 'Queue Utilization Percentage',
            copyTextValue: ref.QueueUtilizationPercentage,
            displayText: ref.QueueUtilizationPercentage + '%',
          },
          {
            descriptionName: 'Queue Memory Size',
            copyTextValue: queueSize,
            displayText: queueSize,
          },
        ];

        this.replicationStatus = [
          {
            descriptionName: 'The LSN of the first completed operation + 1',
            copyTextValue: ref.LsnCompletedHead,
            displayText: ref.LsnCompletedHead,
          },
          {
            descriptionName: 'The LSN of last in-order operation received + 1',
            copyTextValue: ref.LsnHead,
            displayText: ref.LsnHead,
          },
          {
            descriptionName: 'The LSN of the first committed operation + 1',
            copyTextValue: ref.LsnCommittedHead,
            displayText: ref.LsnCommittedHead,
          },
          {
            descriptionName: 'The LSN of the most advanced operation received in the ordering queue + 1',
            copyTextValue: ref.LsnTail,
            displayText: ref.LsnTail,
          },
        ];
      }));
    }
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  trackByFn(index, replicaStatus: IRawRemoteReplicatorStatus) {
    return replicaStatus.ReplicaId + index;
  }
}
