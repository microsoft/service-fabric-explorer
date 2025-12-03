import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RestClientService } from 'src/app/services/rest-client.service';
import { ListSettings, ListColumnSettingWithFilter, ListColumnSettingForColoredNodeName, ListColumnSettingForBadge, ListColumnSetting } from 'src/app/Models/ListSettings';
import { forkJoin, interval, Subscription, of, Observable } from 'rxjs';
import { switchMap, startWith, catchError } from 'rxjs/operators';
import { IEssentialListItem } from 'src/app/modules/charts/essential-health-tile/essential-health-tile.component';
import { ListColumnSettingForClickableReplicaId } from '../clickable-replica-id/clickable-replica-id.component';
import { ListColumnSettingForReplicaDetailsHtml } from '../replica-details-html/replica-details-html.component';

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
  essentials?: IEssentialListItem[];
}

@Component({
  selector: 'app-replica-list',
  templateUrl: './replica-list.component.html',
  styleUrls: ['./replica-list.component.scss']
})
export class ReplicaListComponent implements OnInit, OnDestroy {
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

  private readonly REFRESH_INTERVAL_NORMAL = 180000;
  private readonly REFRESH_INTERVAL_FM_QUORUM_LOSS = 10000;
  private readonly REFRESH_INTERVAL_CM_QUORUM_LOSS = 60000;

  activeTab = 'failover-manager';
  
  failoverManagerState: ServiceState = {
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
    isLoading: true,
    essentials: []
  };

  clusterManagerState: ServiceState = {
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
  private expandedReplicasState = new Map<string, { isExpanded: boolean, details: any, detailsHtml: string }>();
  private refreshSubscription: Subscription;
  private currentRefreshInterval = this.REFRESH_INTERVAL_NORMAL;
  private clusterManagerLoaded = false;

  constructor(
    private restClientService: RestClientService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.setupListSettings('failover-manager');
    this.setupListSettings('cluster-manager');
    this.clusterManagerLoaded = true;
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  onTabChange(tabId: string): void {
    this.activeTab = tabId;
    if (tabId === 'cluster-manager' && !this.clusterManagerLoaded) {
      this.loadClusterManagerData();
    }
  }

  private setupListSettings(service: 'failover-manager' | 'cluster-manager'): void {
    const clickHandler = service === 'failover-manager' 
      ? this.handleReplicaClick.bind(this, this.FAILOVER_MANAGER_CONFIG)
      : this.handleReplicaClick.bind(this, this.CLUSTER_MANAGER_CONFIG);

    const showPreviousRole = service === 'failover-manager' 
      ? this.failoverManagerState.showPreviousReplicaRole 
      : this.clusterManagerState.showPreviousReplicaRole;

    const columnSettings = [
      new ListColumnSettingForClickableReplicaId('id', 'Replica Id', clickHandler),
      new ListColumnSettingWithFilter('role', 'Current Replica Role'),
      new ListColumnSettingForBadge('replicaStatusBadge', 'Status'),
      new ListColumnSettingForColoredNodeName('nodeName', 'Node Name'),
      new ListColumnSetting('lastSequenceNumber', 'Last Sequence Number')
    ];

    if (showPreviousRole) {
      columnSettings.splice(1, 0, new ListColumnSettingWithFilter('previousReplicaRole', 'Previous Replica Role'));
    }

    const secondRowColumnSettings = [
      new ListColumnSettingForReplicaDetailsHtml('deployedReplicaDetailsHtml', 'Deployed Replica Details', { colspan: -1 })
    ];

    const listSettings = new ListSettings(
      10, 
      null, 
      'replicas', 
      columnSettings, 
      secondRowColumnSettings, 
      true, 
      (item) => item.isClickable && item.deployedReplicaDetails !== null
    );

    if (service === 'failover-manager') {
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
          const requests: any = {
            failoverManager: this.fetchServiceData(this.FAILOVER_MANAGER_CONFIG, 'failover-manager')
          };

          if (this.clusterManagerLoaded) {
            requests.clusterManager = this.fetchServiceData(this.CLUSTER_MANAGER_CONFIG, 'cluster-manager');
          }

          return forkJoin(requests);
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

  private loadClusterManagerData(): void {
    if (this.clusterManagerLoaded) {
      return;
    }

    this.clusterManagerLoaded = true;
    this.fetchServiceData(this.CLUSTER_MANAGER_CONFIG, 'cluster-manager').subscribe();
  }

  private fetchServiceData(config: ServiceConfig, service: 'failover-manager' | 'cluster-manager'): Observable<any> {
    if (service === 'failover-manager') {
      this.failoverManagerState.isLoading = true;
    } else {
      this.clusterManagerState.isLoading = true;
    }

    return forkJoin({
      replicas: this.restClientService.getReplicasOnPartition(config.applicationId, config.serviceId, config.partitionId),
      nodes: this.restClientService.getFMMNodes(),
      partition: this.restClientService.getPartition(config.applicationId, config.serviceId, config.partitionId)
    }).pipe(
      catchError(() => {
        if (service === 'failover-manager') {
          this.failoverManagerState.isLoading = false;
        } else {
          this.clusterManagerState.isLoading = false;
        }
        return of(null);
      }),
      switchMap((result) => {
        if (!result) {
          return of(null);
        }

        const { replicas, nodes, partition } = result;
        this.processServiceData(config, service, replicas, nodes, partition);

        if (service === 'failover-manager') {
          this.failoverManagerState.isLoading = false;
        } else {
          this.clusterManagerState.isLoading = false;
        }

        return of(result);
      })
    );
  }

  private processServiceData(
    config: ServiceConfig,
    service: 'failover-manager' | 'cluster-manager',
    replicas: any[],
    nodes: any[],
    partition: any
  ): void {
    const minReplicaSetSize = partition.MinReplicaSetSize || 0;
    const targetReplicaSetSize = partition.TargetReplicaSetSize || 0;
    const partitionStatus = partition.PartitionStatus || '';
    const lastQuorumLossDuration = this.formatDuration(partition.LastQuorumLossDurationInSeconds || 0);

    const allPreviousNone = replicas.every(replica => 
      replica.PreviousReplicaRole === 'None' || !replica.PreviousReplicaRole
    );

    const showPreviousReplicaRole = !allPreviousNone;
    const writeQuorum = this.calculateWriteQuorum(replicas);
    const writeQuorumReplicaIds = this.getReplicaIdsCountedInWriteQuorum(replicas);

    const nodeStatusMap = new Map(nodes.map(node => [node.Name, node.NodeStatus]));
    const nodeSeedMap = new Map(nodes.map(node => [node.Name, node.IsSeedNode]));

    const replicaData = this.transformReplicas(
      replicas,
      writeQuorumReplicaIds,
      partitionStatus,
      nodeStatusMap,
      nodeSeedMap,
      config.partitionId
    );

    const highlightedReplicaCount = replicaData.filter(r => r.countsTowardWriteQuorum && r.replicaStatus !== 'Ready').length;
    const currentReplicaSetSize = replicaData.filter(r => r.countsTowardWriteQuorum).length;
    const readyReplicasInQuorum = replicaData.filter(r => r.countsTowardWriteQuorum && r.replicaStatus === 'Ready').length;
    const quorumNeeded = writeQuorum - readyReplicasInQuorum;

    if (service === 'failover-manager') {
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
    this.fetchLastSequenceNumbers(replicaData, config.partitionId);
  }

  private updateFailoverManagerState(state: Partial<ServiceState>): void {
    const previousShowPreviousRole = this.failoverManagerState.showPreviousReplicaRole;
    
    this.failoverManagerState = { ...this.failoverManagerState, ...state };
    
    if (previousShowPreviousRole !== this.failoverManagerState.showPreviousReplicaRole) {
      this.setupListSettings('failover-manager');
    }

    this.updateFailoverManagerEssentials();
  }

  private updateClusterManagerState(state: Partial<ServiceState>): void {
    const previousShowPreviousRole = this.clusterManagerState.showPreviousReplicaRole;

    this.clusterManagerState = { ...this.clusterManagerState, ...state };

    if (previousShowPreviousRole !== this.clusterManagerState.showPreviousReplicaRole) {
      this.setupListSettings('cluster-manager');
    }
  }

  private transformReplicas(
    replicas: any[],
    writeQuorumReplicaIds: Set<string>,
    partitionStatus: string,
    nodeStatusMap: Map<string, string>,
    nodeSeedMap: Map<string, boolean>,
    partitionId: string
  ): any[] {
    const replicaData = replicas.map(replica => {
      const countsTowardWriteQuorum = writeQuorumReplicaIds.has(replica.ReplicaId);
      const shouldHighlight = countsTowardWriteQuorum && replica.ReplicaStatus !== 'Ready';
      const previousState = this.expandedReplicasState.get(replica.ReplicaId);
      
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
        isSecondRowCollapsed: previousState ? !previousState.isExpanded : true,
        deployedReplicaDetails: previousState?.details || null,
        deployedReplicaDetailsHtml: previousState?.detailsHtml || null,
        lastSequenceNumber: replica.ReplicaStatus === 'Down' ? 'N/A' : 'Loading...',
        isPrimary: replica.ReplicaRole === 'Primary',
        isClickable: replica.ReplicaStatus !== 'Down',
        countsTowardWriteQuorum: countsTowardWriteQuorum,
        cssClass: (partitionStatus === 'InQuorumLoss' && shouldHighlight) ? 'write-quorum-replica-row' : ''
      };
    });

    return this.sortReplicasByRole(replicaData);
  }

  private fetchLastSequenceNumbers(replicaData: any[], partitionId: string): void {
    replicaData.forEach((replicaItem) => {
      if (replicaItem.replicaStatus === 'Down') {
        return;
      }
      
      this.restClientService.getDeployedReplicaDetail(
        replicaItem.nodeName,
        partitionId,
        replicaItem.id
      ).subscribe({
        next: (detail: any) => {
          const lastSeqNum = detail?.ReplicatorStatus?.ReplicationQueueStatus?.LastSequenceNumber;
          replicaItem.lastSequenceNumber = lastSeqNum !== undefined && lastSeqNum !== null ? lastSeqNum.toString() : 'N/A';
        },
        error: () => {
          replicaItem.lastSequenceNumber = 'Error';
        }
      });
    });
  }

  private updateRefreshInterval(): void {
    const failoverManagerInQuorumLoss = 
      this.failoverManagerState.partitionStatus === 'InQuorumLoss' || 
      this.failoverManagerState.partitionStatus === 'Reconfiguring';
    
    const clusterManagerInQuorumLoss =
      this.clusterManagerState.partitionStatus === 'InQuorumLoss' || 
      this.clusterManagerState.partitionStatus === 'Reconfiguring';

    let newInterval = this.REFRESH_INTERVAL_NORMAL;
    
    if (failoverManagerInQuorumLoss) {
      newInterval = this.REFRESH_INTERVAL_FM_QUORUM_LOSS;
    } else if (clusterManagerInQuorumLoss) {
      newInterval = this.REFRESH_INTERVAL_CM_QUORUM_LOSS;
    }

    this.restartAutoRefreshWithNewInterval(newInterval);
  }

  private calculateWriteQuorum(replicas: any[]): number {
    const allPreviousNone = replicas.every(replica => 
      replica.PreviousReplicaRole === 'None' || !replica.PreviousReplicaRole
    );

    const n = allPreviousNone
      ? replicas.filter(replica => 
          replica.ReplicaRole === 'ActiveSecondary' || replica.ReplicaRole === 'Primary'
        ).length
      : replicas.filter(replica => 
          replica.PreviousReplicaRole === 'ActiveSecondary' || replica.PreviousReplicaRole === 'Primary'
        ).length;

    return Math.floor(n / 2) + 1;
  }

  private getReplicaIdsCountedInWriteQuorum(replicas: any[]): Set<string> {
    const allPreviousNone = replicas.every(replica => 
      replica.PreviousReplicaRole === 'None' || !replica.PreviousReplicaRole
    );

    const replicaIds = new Set<string>();

    replicas.forEach(replica => {
      const countsTowardWriteQuorum = allPreviousNone
        ? replica.ReplicaRole === 'ActiveSecondary' || replica.ReplicaRole === 'Primary'
        : replica.PreviousReplicaRole === 'ActiveSecondary' || replica.PreviousReplicaRole === 'Primary';

      if (countsTowardWriteQuorum) {
        replicaIds.add(replica.ReplicaId);
      }
    });

    return replicaIds;
  }

  private sortReplicasByRole(replicas: any[]): any[] {
    const roleOrder: { [key: string]: number } = {
      'Primary': 1,
      'ActiveSecondary': 2,
      'IdleSecondary': 3,
      'None': 4
    };

    return replicas.sort((a, b) => {
      const orderA = roleOrder[a.role] || 999;
      const orderB = roleOrder[b.role] || 999;
      return orderA - orderB;
    });
  }

  private updateFailoverManagerEssentials(): void {
    this.failoverManagerState.essentials = [
      {
        descriptionName: 'Min Replica Set Size',
        displayText: this.failoverManagerState.minReplicaSetSize.toString(),
        copyTextValue: this.failoverManagerState.minReplicaSetSize.toString()
      },
      {
        descriptionName: 'Target Replica Set Size',
        displayText: this.failoverManagerState.targetReplicaSetSize.toString(),
        copyTextValue: this.failoverManagerState.targetReplicaSetSize.toString()
      },
      {
        descriptionName: 'Write Quorum',
        displayText: this.failoverManagerState.writeQuorum.toString(),
        copyTextValue: this.failoverManagerState.writeQuorum.toString()
      }
    ];

    if (this.failoverManagerState.partitionStatus === 'InQuorumLoss') {
      this.failoverManagerState.essentials.push({
        descriptionName: 'Quorum Loss Duration',
        displayText: this.failoverManagerState.lastQuorumLossDuration,
        copyTextValue: this.failoverManagerState.lastQuorumLossDuration
      });
    }
  }

  private detectQuorumLossTransitions(): void {
    const failoverManagerInQuorumLoss = this.failoverManagerState.partitionStatus === 'InQuorumLoss';
    const clusterManagerInQuorumLoss = this.clusterManagerState.partitionStatus === 'InQuorumLoss';

    if (this.previousFailoverManagerInQuorumLoss && !failoverManagerInQuorumLoss) {
      location.reload();
    }

    if (this.previousClusterManagerInQuorumLoss && !clusterManagerInQuorumLoss) {
      location.reload();
    }

    this.previousFailoverManagerInQuorumLoss = failoverManagerInQuorumLoss;
    this.previousClusterManagerInQuorumLoss = clusterManagerInQuorumLoss;
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
  
    if (days > 0) parts.push(`${days} d`);
    if (hours > 0) parts.push(`${hours} hr`);
    if (minutes > 0) parts.push(`${minutes} m`);
    if (secs > 0) parts.push(`${secs} s`);
  
    return parts.join(' ');
  }

  handleReplicaClick(config: ServiceConfig, replicaItem: any): void {
    if (!replicaItem.isClickable) {
      return;
    }
    
    replicaItem.isSecondRowCollapsed = !replicaItem.isSecondRowCollapsed;
    
    if (!replicaItem.isSecondRowCollapsed) {
      if (!replicaItem.deployedReplicaDetails) {
        this.loadDeployedReplicaDetails(replicaItem, config.partitionId);
      } else {
        this.expandedReplicasState.set(replicaItem.id, {
          isExpanded: true,
          details: replicaItem.deployedReplicaDetails,
          detailsHtml: replicaItem.deployedReplicaDetailsHtml
        });
      }
    } else {
      this.expandedReplicasState.delete(replicaItem.id);
    }
  }

  private loadDeployedReplicaDetails(replicaItem: any, partitionId: string): void {
    if (replicaItem.deployedReplicaDetails || !replicaItem.isClickable) {
      return;
    }
    
    this.restClientService.getDeployedReplicaDetail(
      replicaItem.nodeName,
      partitionId,
      replicaItem.id
    ).subscribe({
      next: (details: any) => {
        replicaItem.deployedReplicaDetails = details;
        
        this.expandedReplicasState.set(replicaItem.id, {
          isExpanded: true,
          details: replicaItem.deployedReplicaDetails,
          detailsHtml: null
        });
      },
      error: () => {
        replicaItem.deployedReplicaDetails = { error: true };
        
        this.expandedReplicasState.set(replicaItem.id, {
          isExpanded: true,
          details: replicaItem.deployedReplicaDetails,
          detailsHtml: null
        });
      }
    });
  }
}