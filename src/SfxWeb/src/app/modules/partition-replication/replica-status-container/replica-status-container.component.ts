import { Component, OnInit, Input, OnChanges, OnDestroy, ChangeDetectionStrategy, inject } from '@angular/core';
import { ExperienceService } from 'src/app/services/experience.service';
import { IRawReplicatorStatus, IRawRemoteReplicatorStatus } from 'src/app/Models/RawDataTypes';
import { ReplicaOnPartition } from 'src/app/Models/DataModels/Replica';
import { Utils } from 'src/app/Utils/Utils';
import { Subscription } from 'rxjs';
import { IEssentialListItem } from '../../charts/essential-health-tile/essential-health-tile.component';

export interface ITimedReplication extends IRawRemoteReplicatorStatus {
  date: Date;
}


const reduceReplicators = (data: Record<string, IRawRemoteReplicatorStatus>, replica: IRawRemoteReplicatorStatus) => {
  data[replica.ReplicaId] = replica;
  return data;
};

@Component({
    selector: 'app-replica-status-container',
    templateUrl: './replica-status-container.component.html',
    styleUrls: ['./replica-status-container.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ReplicaStatusContainerComponent implements OnChanges, OnDestroy {
  public experience = inject(ExperienceService);

  @Input() replicas!: ReplicaOnPartition[];
  sortedReplicas: ReplicaOnPartition[] = [];
  search = '';
  page = 1;
  readonly pageSize = 12;
  filteredReplicas: ReplicaOnPartition[] = [];
  visibleReplicas: ReplicaOnPartition[] = [];
  pageCount = 1;
  selectedReplica?: ReplicaOnPartition;

  selectReplicaId(id: string) {
    this.selectedReplica = this.visibleReplicas.find(replica => replica.id === id && this.replicaDict[replica.name]);
  }

  updatePage(page = this.page) {
    const query = this.search.trim().toLowerCase();
    this.filteredReplicas = this.sortedReplicas.filter(replica => !query || `${replica.id} ${replica.raw.NodeName} ${replica.role} ${replica.raw.ReplicaStatus}`.toLowerCase().includes(query));
    this.pageCount = Math.max(1, Math.ceil(this.filteredReplicas.length / this.pageSize));
    this.page = Math.max(1, Math.min(page, this.pageCount));
    this.visibleReplicas = this.filteredReplicas.slice((this.page - 1) * this.pageSize, this.page * this.pageSize);
    if (this.selectedReplica) {
      this.selectedReplica = this.visibleReplicas.find(replica => replica.id === this.selectedReplica!.id && this.replicaDict[replica.name]);
    }
  }

  replicaDict: Record<string, IRawRemoteReplicatorStatus> = {};
  expandedDict = {};
  cachedData: Record<string, ITimedReplication[]> = {};

  primaryReplica!: ReplicaOnPartition;

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

          if (this.cachedData[replicator.ReplicaId].length >= 20) {
            this.cachedData[replicator.ReplicaId].shift();
          }

          this.cachedData[replicator.ReplicaId].push(cacheData);
        });

        this.sortedReplicas = [...this.replicas].sort((a, b) => a.replicaRoleSortPriority - b.replicaRoleSortPriority);
        this.updatePage();
        const activeIds = new Set(replicatorData.RemoteReplicators.map(replica => replica.ReplicaId));
        Object.keys(this.cachedData).forEach(id => {
          if (!activeIds.has(id)) { delete this.cachedData[id]; }
        });

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

  trackByFn(index: number, replicaStatus: IRawRemoteReplicatorStatus) {
    return replicaStatus.ReplicaId + index;
  }
}
