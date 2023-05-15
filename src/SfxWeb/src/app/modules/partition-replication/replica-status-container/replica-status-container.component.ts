import { Component, OnInit, Input, OnChanges, OnDestroy } from '@angular/core';
import { IRawReplicatorStatus, IRawRemoteReplicatorStatus } from 'src/app/Models/RawDataTypes';
import { ReplicaOnPartition } from 'src/app/Models/DataModels/Replica';
import { Utils } from 'src/app/Utils/Utils';
import { Subscription } from 'rxjs';
import { IEssentialListItem } from '../../charts/essential-health-tile/essential-health-tile.component';
import { ITableData } from 'src/app/views/cluster/metrics/metrics.component';
import { IProgressStatus, PhaseDiagramComponent } from 'src/app/shared/component/phase-diagram/phase-diagram.component';

export interface ITimedReplication extends IRawRemoteReplicatorStatus {
  date: Date;
}

export interface IReplicationTimeLineData {
  date: Date;
  dataPoints: IRawRemoteReplicatorStatus[];
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
  sortedReplicas: ReplicaOnPartition[] = [];

  chart: IReplicationTimeLineData[] = [];
  replicaDict = {};
  expandedDict = {};
  cachedData: Record<string, ITimedReplication[]> = {};

  primaryReplica: ReplicaOnPartition;

  overviewItems: IEssentialListItem[] = [];
  replicationStatus: IEssentialListItem[] = [];

  sub: Subscription = new Subscription();

  tableData: ITableData = {
    dataPoints: [],
    categories: [],
    title: '',
    tooltipFunction: null
  };

  phaseDiagram: IProgressStatus[] = [
    {
      name: 'copy state'
    },
    {
      name: 'copy queue drain'
    },
    {
      name: 'draining replication queue'
    }
  ]



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

        this.tableData = {
          dataPoints: [
            {
              label: "Received and not applied",
              data: [],
              type: 'bar'
            }
          ],
          categories: [],
          title: 'Applied and not Received',
          tooltipFunction: null
        }

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

          this.tableData.dataPoints[0].data.push(+replicator.RemoteReplicatorAcknowledgementStatus.ReplicationStreamAcknowledgementDetail.ReceivedAndNotAppliedCount);
          this.tableData.categories.push(replicator.ReplicaId);
        });

        this.sortedReplicas = this.replicas.sort((a, b) => a.replicaRoleSortPriority - b.replicaRoleSortPriority);

        this.chart = [...this.chart, {
          date: new Date(),
          dataPoints: replicatorData.RemoteReplicators
        }]

        if (this.chart.length > 20) {
          this.chart.shift();
        }

        // ref for shorter lines below
        const ref = this.primaryReplica.detail.replicatorStatus.raw.ReplicationQueueStatus;

        console.log(this)

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
            descriptionName: 'Logical Sequence Number(LSN) ',
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
    return replicaStatus.ReplicaId + index;
  }
}
