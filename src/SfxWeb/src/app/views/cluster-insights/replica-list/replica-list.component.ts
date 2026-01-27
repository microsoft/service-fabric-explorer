import { Component, OnInit, OnDestroy } from '@angular/core';
import { RestClientService } from 'src/app/services/rest-client.service';
import { ListSettings, ListColumnSettingWithFilter, ListColumnSettingForColoredNodeName, ListColumnSettingForBadge, ListColumnSetting } from 'src/app/Models/ListSettings';
import { forkJoin, interval, Subscription, of, Observable } from 'rxjs';
import { switchMap, startWith, catchError } from 'rxjs/operators';
import { ListColumnSettingWithExpandableLink } from '../replica-id-link/replica-id-link.component';
import { ListColumnSettingForExpandedDetails } from '../replica-details/replica-details.component';

interface ServiceConfig {
  name: string;
  applicationId: string;
  serviceId: string;
  partitionId: string;
}

interface ServiceState {
  replicaData: any[];
  minReplicaSetSize: number;
  targetReplicaSetSize: number;
  currentReplicaSetSize: number;
  partitionStatus: string;
  lastQuorumLossDuration: string;
  writeQuorum: number;
  showPreviousReplicaRole: boolean;
  highlightedReplicaCount: number;
  quorumNeeded: number;
  listSettings?: ListSettings;
  isLoading?: boolean;
}

enum ServiceName {
  FailoverManager = 'failover-manager',
  ClusterManager = 'cluster-manager'
}

enum PartitionStatus {
  Ready = 'Ready',
  InQuorumLoss = 'InQuorumLoss',
  Reconfiguring = 'Reconfiguring'
}

enum ReplicaRole {
  Primary = 'Primary',
  ActiveSecondary = 'ActiveSecondary',
  IdleSecondary = 'IdleSecondary',
  None = 'None'
}

@Component({
  selector: 'app-replica-list',
  templateUrl: './replica-list.component.html',
  styleUrls: ['./replica-list.component.scss']
})
export class ReplicaListComponent implements OnInit, OnDestroy {
  public readonly ServiceName = ServiceName;
  public readonly PartitionStatus = PartitionStatus;
  public readonly ReplicaRole = ReplicaRole;

  private readonly FAILOVER_MANAGER_CONFIG: ServiceConfig = {
    name: 'Failover Manager',
    applicationId: 'System',
    serviceId: 'System/FailoverManagerService',
    partitionId: '00000000-0000-0000-0000-000000000001'
  };

  private readonly CLUSTER_MANAGER_CONFIG: ServiceConfig = {
    name: 'Cluster Manager',
    applicationId: 'System',
    serviceId: 'System/ClusterManagerService',
    partitionId: '00000000-0000-0000-0000-000000002000'
  };

  private readonly REFRESH_INTERVAL_NORMAL = 180000; // 3 minutes
  private readonly REFRESH_INTERVAL_QUORUM_LOSS = 90000; // 90 seconds

  public activeTab: ServiceName = ServiceName.FailoverManager;
  
  public failoverManagerState: ServiceState = {
    replicaData: [],
    minReplicaSetSize: 0,
    targetReplicaSetSize: 0,
    currentReplicaSetSize: 0,
    partitionStatus: '',
    lastQuorumLossDuration: '',
    writeQuorum: 0,
    showPreviousReplicaRole: true,
    highlightedReplicaCount: 0,
    quorumNeeded: 0,
    isLoading: true
  };

  public clusterManagerState: ServiceState = {
    replicaData: [],
    minReplicaSetSize: 0,
    targetReplicaSetSize: 0,
    currentReplicaSetSize: 0,
    partitionStatus: '',
    lastQuorumLossDuration: '',
    writeQuorum: 0,
    showPreviousReplicaRole: true,
    highlightedReplicaCount: 0,
    quorumNeeded: 0,
    isLoading: false
  };
  
  private previousFailoverManagerInQuorumLoss = false;
  private previousClusterManagerInQuorumLoss = false;
  private expandedReplicasState = new Map<string, boolean>();
  private refreshSubscription: Subscription;
  private currentRefreshInterval = this.REFRESH_INTERVAL_NORMAL;

  constructor(
    private restClientService: RestClientService
  ) {}

  ngOnInit(): void {
    this.setupReplicaList(ServiceName.FailoverManager);
    this.setupReplicaList(ServiceName.ClusterManager);
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  public onTabChange(tabId: ServiceName): void {
    this.activeTab = tabId;
  }

  private setupReplicaList(service: ServiceName): void {
    const clickHandler = this.handleReplicaClick.bind(this);

    const showPreviousRole = service === ServiceName.FailoverManager 
      ? this.failoverManagerState.showPreviousReplicaRole 
      : this.clusterManagerState.showPreviousReplicaRole;

    const columnSettings = [
      new ListColumnSettingWithExpandableLink('id', 'Replica Id', clickHandler),
      new ListColumnSettingWithFilter('role', 'Current Replica Role'),
      new ListColumnSettingForBadge('replicaStatusBadge', 'Status'),
      new ListColumnSettingForColoredNodeName('nodeName', 'Node Name'),
      new ListColumnSetting('lastSequenceNumber', 'Last Sequence Number')
    ];

    if (showPreviousRole) {
      columnSettings.splice(1, 0, new ListColumnSettingWithFilter('previousReplicaRole', 'Previous Replica Role'));
    }

    const secondRowColumnSettings = [
      new ListColumnSettingForExpandedDetails('deployedReplicaDetails', 'Deployed Replica Details', { colspan: -1 })
    ];

    const listSettings = new ListSettings(
      15, 
      null, 
      'replicas', 
      columnSettings, 
      secondRowColumnSettings, 
      true, 
      (item) => item.isClickable && item.deployedReplicaDetails !== null,
      true,  // searchable
      false  // showRowExpander
    );

    if (service === ServiceName.FailoverManager) {
      this.failoverManagerState.listSettings = listSettings;
    } else {
      this.clusterManagerState.listSettings = listSettings;
    }
  }

  private startAutoRefresh(): void {
    this.refreshSubscription = interval(this.currentRefreshInterval)
      .pipe(
        startWith(0),
        switchMap(() => {
          return this.restClientService.getNodes().pipe(
            switchMap((nodes) => {
              return forkJoin({
                failoverManager: this.fetchServiceData(this.FAILOVER_MANAGER_CONFIG, ServiceName.FailoverManager, nodes),
                clusterManager: this.fetchServiceData(this.CLUSTER_MANAGER_CONFIG, ServiceName.ClusterManager, nodes)
              });
            }),
            catchError(() => {
              // If getNodes fails, still try to fetch service data
              return forkJoin({
                failoverManager: this.fetchServiceData(this.FAILOVER_MANAGER_CONFIG, ServiceName.FailoverManager, []),
                clusterManager: this.fetchServiceData(this.CLUSTER_MANAGER_CONFIG, ServiceName.ClusterManager, [])
              });
            })
          );
        })
      )
      .subscribe(() => {
        this.detectQuorumLossTransitions();
      });
  }

  private restartAutoRefreshWithNewInterval(newInterval: number): void {
    if (this.currentRefreshInterval !== newInterval) {
      this.currentRefreshInterval = newInterval;
      
      if (this.refreshSubscription) {
        this.refreshSubscription.unsubscribe();
      }
      
      this.startAutoRefresh();
    }
  }

  private fetchServiceData(config: ServiceConfig, service: ServiceName, nodes: any[]): Observable<any> {
    if (service === ServiceName.FailoverManager) {
      this.failoverManagerState.isLoading = true;
    } else {
      this.clusterManagerState.isLoading = true;
    }

    return forkJoin({
      replicas: this.restClientService.getReplicasOnPartition(config.applicationId, config.serviceId, config.partitionId),
      partition: this.restClientService.getPartition(config.applicationId, config.serviceId, config.partitionId)
    }).pipe(
      catchError(() => {
        if (service === ServiceName.FailoverManager) {
          this.failoverManagerState.isLoading = false;
        } else if (service === ServiceName.ClusterManager) {
          this.clusterManagerState.isLoading = false;
        }
        return of(null);
      }),
      switchMap((result) => {
        if (!result) {
          return of(null);
        }

        const { replicas, partition } = result;
        this.processServiceReplicas(config, service, replicas, nodes, partition);

        if (service === ServiceName.FailoverManager) {
          this.failoverManagerState.isLoading = false;
        } else {
          this.clusterManagerState.isLoading = false;
        }

        return of(result);
      })
    );
  }

  private processServiceReplicas(
    config: ServiceConfig,
    service: ServiceName,
    replicas: any[],
    nodes: any[],
    partition: any
  ): void {
    const minReplicaSetSize = partition.MinReplicaSetSize || 0;
    const targetReplicaSetSize = partition.TargetReplicaSetSize || 0;
    const partitionStatus = partition.PartitionStatus || '';
    const lastQuorumLossDuration = this.formatDuration(partition.LastQuorumLossDurationInSeconds || 0);

    const { isInReconfiguration, writeQuorum, quorumReplicas } = this.calculateWriteQuorum(replicas);
    const showPreviousReplicaRole = isInReconfiguration;

    const nodeStatusMap = new Map(nodes.map(node => [node.Name, node.NodeStatus]));
    const nodeSeedMap = new Map(nodes.map(node => [node.Name, node.IsSeedNode]));

    const unsortedReplicaData = replicas.map(replica => {
      const countsTowardWriteQuorum = quorumReplicas.has(replica.ReplicaId);
      const shouldHighlight = countsTowardWriteQuorum && replica.ReplicaStatus !== 'Ready';
      const isExpanded = this.expandedReplicasState.get(replica.ReplicaId) || false;

      return {
        id: replica.ReplicaId,
        nodeName: replica.NodeName,
        raw: {
          ...replica,
          NodeStatus: nodeStatusMap.get(replica.NodeName) || 'Unknown',
          IsSeedNode: nodeSeedMap.get(replica.NodeName) || false
        },
        previousReplicaRole: replica.PreviousReplicaRole,
        role: replica.ReplicaRole,
        replicaStatus: replica.ReplicaStatus,
        replicaStatusBadge: {
          text: replica.ReplicaStatus,
          badgeClass: replica.ReplicaStatus === 'Ready' ? 'badge-ok' : 'badge-error'
        },
        isSecondRowCollapsed: !isExpanded,
        deployedReplicaDetails: null,
        lastSequenceNumber: replica.ReplicaStatus === 'Down' ? 'N/A' : 'Loading...',
        isPrimary: replica.ReplicaRole === ReplicaRole.Primary,
        isClickable: replica.ReplicaStatus !== 'Down',
        countsTowardWriteQuorum: countsTowardWriteQuorum,
        cssClass: (partitionStatus === PartitionStatus.InQuorumLoss && shouldHighlight) ? 'highlighted-row' : ''
      };
    });

    const replicaData = this.sortReplicasByRole(unsortedReplicaData);

    const highlightedReplicaCount = replicaData.filter(r => r.countsTowardWriteQuorum && r.replicaStatus !== 'Ready').length;
    const currentReplicaSetSize = replicaData.filter(r => r.countsTowardWriteQuorum).length;
    const readyReplicasInQuorum = replicaData.filter(r => r.countsTowardWriteQuorum && r.replicaStatus === 'Ready').length;
    const quorumNeeded = writeQuorum - readyReplicasInQuorum;

    if (service === ServiceName.FailoverManager) {
      this.updateFailoverManagerState({
        replicaData,
        minReplicaSetSize,
        targetReplicaSetSize,
        currentReplicaSetSize,
        partitionStatus,
        lastQuorumLossDuration,
        writeQuorum,
        showPreviousReplicaRole,
        highlightedReplicaCount,
        quorumNeeded
      });
    } else {
      this.updateClusterManagerState({
        replicaData,
        minReplicaSetSize,
        targetReplicaSetSize,
        currentReplicaSetSize,
        partitionStatus,
        lastQuorumLossDuration,
        writeQuorum,
        showPreviousReplicaRole,
        highlightedReplicaCount,
        quorumNeeded
      });
    }

    this.updateRefreshInterval();
    this.refreshExpandedReplicaDetails(replicaData, config.partitionId);
  }

  private updateFailoverManagerState(state: Partial<ServiceState>): void {
    const previousShowPreviousRole = this.failoverManagerState.showPreviousReplicaRole;
    
    this.failoverManagerState = { ...this.failoverManagerState, ...state };
    
    if (previousShowPreviousRole !== this.failoverManagerState.showPreviousReplicaRole) {
      this.setupReplicaList(ServiceName.FailoverManager);
    }
  }

  private updateClusterManagerState(state: Partial<ServiceState>): void {
    const previousShowPreviousRole = this.clusterManagerState.showPreviousReplicaRole;

    this.clusterManagerState = { ...this.clusterManagerState, ...state };

    if (previousShowPreviousRole !== this.clusterManagerState.showPreviousReplicaRole) {
      this.setupReplicaList(ServiceName.ClusterManager);
    }
  }

  private refreshExpandedReplicaDetails(replicaData: any[], partitionId: string): void {
    replicaData.forEach((replicaItem) => {
      if (replicaItem.replicaStatus === 'Down') {
        return;
      }
      
      this.loadDeployedReplicaDetails(replicaItem, partitionId);
    });
  }

  private updateRefreshInterval(): void {
    const failoverManagerInQuorumLoss = 
      this.failoverManagerState.partitionStatus === PartitionStatus.InQuorumLoss || 
      this.failoverManagerState.partitionStatus === PartitionStatus.Reconfiguring;
    
    const clusterManagerInQuorumLoss =
      this.clusterManagerState.partitionStatus === PartitionStatus.InQuorumLoss || 
      this.clusterManagerState.partitionStatus === PartitionStatus.Reconfiguring;

    let newInterval = this.REFRESH_INTERVAL_NORMAL;
    
    // Refresh faster when in quorum loss to see replica data changes
    if (failoverManagerInQuorumLoss || clusterManagerInQuorumLoss) {
      newInterval = this.REFRESH_INTERVAL_QUORUM_LOSS;
    }

    this.restartAutoRefreshWithNewInterval(newInterval);
  }

  private calculateWriteQuorum(replicas: any[]): { isInReconfiguration: boolean; writeQuorum: number; quorumReplicas: Set<string> } {
    // If previous configuration (PC) role for all replicas are not none, then the partition is in reconfiguration.
    const isInReconfiguration = !replicas.every(replica => 
      replica.PreviousReplicaRole === ReplicaRole.None
    );

    const writeQuorumReplicaIds = new Set<string>();
    let count = 0;

    // If partition is in reconfiguration, write quorum is calculated using PC role. 
    // Otherwise, it is calculated using current configuration (CC) role.
    replicas.forEach(replica => {
      const countsTowardWriteQuorum = isInReconfiguration
        ? replica.PreviousReplicaRole === ReplicaRole.ActiveSecondary || replica.PreviousReplicaRole === ReplicaRole.Primary
        : replica.ReplicaRole === ReplicaRole.ActiveSecondary || replica.ReplicaRole === ReplicaRole.Primary;

      if (countsTowardWriteQuorum) {
        writeQuorumReplicaIds.add(replica.ReplicaId);
        count++;
      }
    });

    const writeQuorum = Math.floor(count / 2) + 1;

    return { isInReconfiguration, writeQuorum, quorumReplicas: writeQuorumReplicaIds };
  }

  private sortReplicasByRole(replicas: any[]): any[] {
    const roleOrder: { [key: string]: number } = {
      [ReplicaRole.Primary]: 1,
      [ReplicaRole.ActiveSecondary]: 2,
      [ReplicaRole.IdleSecondary]: 3,
      [ReplicaRole.None]: 4
    };

    return replicas.sort((a, b) => {
      const orderA = roleOrder[a.role] || 999;
      const orderB = roleOrder[b.role] || 999;
      return orderA - orderB;
    });
  }

  private detectQuorumLossTransitions(): void {
    const failoverManagerInQuorumLoss = this.failoverManagerState.partitionStatus === PartitionStatus.InQuorumLoss;
    const clusterManagerInQuorumLoss = this.clusterManagerState.partitionStatus === PartitionStatus.InQuorumLoss;

    // Reload the whole page after CM and/or FM is out of QL
    if (this.previousFailoverManagerInQuorumLoss && !failoverManagerInQuorumLoss) {
      location.reload();
    }

    if (this.previousClusterManagerInQuorumLoss && !clusterManagerInQuorumLoss) {
      location.reload();
    }

    this.previousFailoverManagerInQuorumLoss = failoverManagerInQuorumLoss;
    this.previousClusterManagerInQuorumLoss = clusterManagerInQuorumLoss;
  }

  private formatDuration(seconds: number): string {
    if (seconds === 0) {
      return '0 seconds';
    }
  
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
  
    const parts: string[] = [];
  
    if (days > 0) parts.push(`${days} d`);
    if (hours > 0) parts.push(`${hours} hr`);
    if (minutes > 0) parts.push(`${minutes} m`);
    if (secs > 0) parts.push(`${secs} s`);
  
    return parts.join(' ');
  }

  private handleReplicaClick(replicaItem: any): void {
    if (!replicaItem.isClickable) {
      return;
    }
    
    replicaItem.isSecondRowCollapsed = !replicaItem.isSecondRowCollapsed;
    
    if (!replicaItem.isSecondRowCollapsed) {
      this.expandedReplicasState.set(replicaItem.id, true);
    } else {
      this.expandedReplicasState.set(replicaItem.id, false);
    }
  }

  private loadDeployedReplicaDetails(replicaItem: any, partitionId: string): void {
    if (!replicaItem.isClickable) {
      return;
    }
    
    this.restClientService.getDeployedReplicaDetail(
      replicaItem.nodeName,
      partitionId,
      replicaItem.id
    ).subscribe({
      next: (details: any) => {
        replicaItem.deployedReplicaDetails = details;
        const lastSeqNum = details?.ReplicatorStatus?.ReplicationQueueStatus?.LastSequenceNumber;
        replicaItem.lastSequenceNumber = lastSeqNum !== undefined && lastSeqNum !== null ? lastSeqNum.toString() : 'N/A';
      },
      error: () => {
        replicaItem.deployedReplicaDetails = { error: true };
        replicaItem.lastSequenceNumber = 'Error';
      }
    });
  }
}