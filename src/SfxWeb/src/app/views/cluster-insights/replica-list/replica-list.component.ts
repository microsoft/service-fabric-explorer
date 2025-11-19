import { Component, OnInit, OnDestroy } from '@angular/core';
import { RestClientService } from 'src/app/services/rest-client.service';
import { ListSettings, ListColumnSettingWithFilter, ListColumnSettingForColoredNodeName, ListColumnSettingForBadge } from 'src/app/Models/ListSettings';
import { forkJoin, interval, Subscription } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';
import { IEssentialListItem } from 'src/app/modules/charts/essential-health-tile/essential-health-tile.component';

@Component({
  selector: 'app-replica-list',
  templateUrl: './replica-list.component.html',
  styleUrls: ['./replica-list.component.scss']
})
export class ReplicaListComponent implements OnInit, OnDestroy {
  listSettings: ListSettings;
  replicaData: any[] = [];
  recoveryPercentage: number = 0;
  minReplicaSetSize: number = 0;
  targetReplicaSetSize: number = 0;
  partitionStatus: string = '';
  lastQuorumLossDuration: string = '';
  writeQuorum: number = 0;
  activeTab: string = 'failover-manager';
  failoverManagerEssentials: IEssentialListItem[] = [];
  
  private refreshSubscription: Subscription;
  private readonly REFRESH_INTERVAL_NORMAL = 180000; // 3 minutes when healthy
  private readonly REFRESH_INTERVAL_QUORUM_LOSS = 5000; // 5 seconds when in quorum loss
  private currentRefreshInterval: number = this.REFRESH_INTERVAL_NORMAL;

  constructor(private restClientService: RestClientService) {}

  ngOnInit(): void {
    this.setupReplicaList();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  setupReplicaList(): void {
    const columnSettings = [
      new ListColumnSettingWithFilter('previousReplicaRole', 'Previous Replica Role'),
      new ListColumnSettingWithFilter('role', 'Current Replica Role'),
      new ListColumnSettingForBadge('replicaStatusBadge', 'Status'),
      new ListColumnSettingWithFilter('id', 'Replica Id'),
      new ListColumnSettingForColoredNodeName('nodeName', 'Node Name')
    ];

    this.listSettings = new ListSettings(10, null, 'replicas', columnSettings);
  }

  startAutoRefresh(): void {
    this.refreshSubscription = interval(this.currentRefreshInterval)
      .pipe(
        startWith(0),
        switchMap(() => this.fetchReplicaData())
      )
      .subscribe();
  }

  restartAutoRefreshWithNewInterval(newInterval: number): void {
    if (this.currentRefreshInterval !== newInterval) {
      this.currentRefreshInterval = newInterval;
      
      if (this.refreshSubscription) {
        this.refreshSubscription.unsubscribe();
      }
      
      this.startAutoRefresh();
      
      console.log(`Refresh interval changed to ${newInterval / 1000} seconds`);
    }
  }

  calculateWriteQuorum(replicas: any[]): number {
    // Check if all previous replica roles are None
    const allPreviousNone = replicas.every(replica => 
      replica.PreviousReplicaRole === 'None' || !replica.PreviousReplicaRole
    );

    let n = 0;

    if (allPreviousNone) {
      // Use current replica role
      n = replicas.filter(replica => 
        replica.ReplicaRole === 'ActiveSecondary' || replica.ReplicaRole === 'Primary'
      ).length;
    } else {
      // Use previous replica role
      n = replicas.filter(replica => 
        replica.PreviousReplicaRole === 'ActiveSecondary' || replica.PreviousReplicaRole === 'Primary'
      ).length;
    }

    // Write Quorum = (n + 1) / 2
    return Math.floor(n / 2) + 1;
  }

  updateFailoverManagerEssentials(): void {
    this.failoverManagerEssentials = [
      {
        descriptionName: 'Min Replica Set Size',
        displayText: this.minReplicaSetSize.toString(),
        copyTextValue: this.minReplicaSetSize.toString()
      },
      {
        descriptionName: 'Target Replica Set Size',
        displayText: this.targetReplicaSetSize.toString(),
        copyTextValue: this.targetReplicaSetSize.toString()
      },
      {
        descriptionName: 'Write Quorum',
        displayText: this.writeQuorum.toString(),
        copyTextValue: this.writeQuorum.toString()
      }
    ];

    // Add Quorum Loss Duration if in quorum loss
    if (this.partitionStatus === 'InQuorumLoss') {
      this.failoverManagerEssentials.push({
        descriptionName: '⚠️ Quorum Loss Duration',
        displayText: this.lastQuorumLossDuration,
        copyTextValue: this.lastQuorumLossDuration
      });
    }
  }

  fetchReplicaData() {
    const applicationId = 'System';
    const serviceId = 'System/FailoverManagerService';
    const partitionId = '00000000-0000-0000-0000-000000000001';

    return forkJoin({
      replicas: this.restClientService.getReplicasOnPartition(applicationId, serviceId, partitionId),
      nodes: this.restClientService.getFMMNodes(),
      partition: this.restClientService.getPartition(applicationId, serviceId, partitionId)
    }).pipe(
      switchMap(({ replicas, nodes, partition }) => {
        this.minReplicaSetSize = partition.MinReplicaSetSize || 0;
        this.targetReplicaSetSize = partition.TargetReplicaSetSize || 0;
        this.partitionStatus = partition.PartitionStatus || '';
        
        const seconds = partition.LastQuorumLossDurationInSeconds || 0;
        this.lastQuorumLossDuration = this.formatDuration(seconds);

        // Calculate write quorum
        this.writeQuorum = this.calculateWriteQuorum(replicas);

        // Update essential items
        this.updateFailoverManagerEssentials();

        if (this.partitionStatus === 'InQuorumLoss') {
          this.restartAutoRefreshWithNewInterval(this.REFRESH_INTERVAL_QUORUM_LOSS);
        } else {
          this.restartAutoRefreshWithNewInterval(this.REFRESH_INTERVAL_NORMAL);
        }

        const nodeStatusMap = new Map(nodes.map(node => [node.Name, node.NodeStatus]));

        this.replicaData = replicas.map(replica => ({
          id: replica.ReplicaId,
          nodeName: replica.NodeName,
          raw: {
            ...replica,
            NodeStatus: nodeStatusMap.get(replica.NodeName) || 'Unknown'
          },
          previousReplicaRole: replica.PreviousReplicaRole,
          role: replica.ReplicaRole,
          replicaStatus: replica.ReplicaStatus,
          replicaStatusBadge: {
            text: replica.ReplicaStatus,
            badgeClass: replica.ReplicaStatus === 'Ready' ? 'badge-ok' : 'badge-error'
          }
        }));

        this.calculateRecoveryPercentage();
        
        return [];
      })
    );
  }

  formatDuration(seconds: number): string {
    if (seconds === 0) {
      return '0 seconds';
    }
  
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
  
    const parts: string[] = [];
  
    if (days > 0) {
      parts.push(`${days} d`);
    }
    if (hours > 0) {
      parts.push(`${hours} hr`);
    }
    if (minutes > 0) {
      parts.push(`${minutes} m`);
    }
    if (secs > 0) {
      parts.push(`${secs} s`);
    }
  
    return parts.join(' ');
  }

  calculateRecoveryPercentage(): void {
    const totalReplicas = this.replicaData.length;
    const replicasUp = this.replicaData.filter(replica => replica.replicaStatus === 'Ready').length;

    this.recoveryPercentage = totalReplicas > 0 ? Math.round((replicasUp / totalReplicas) * 100) : 0;
  }
}