import { Component, OnInit, OnDestroy, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { RestClientService } from 'src/app/services/rest-client.service';
import { ListSettings, ListColumnSettingWithFilter, ListColumnSettingForColoredNodeName, ListColumnSettingForBadge, ListColumnSetting } from 'src/app/Models/ListSettings';
import { forkJoin, interval, Subscription, of, Observable } from 'rxjs';
import { switchMap, startWith, catchError, tap } from 'rxjs/operators';
import { IEssentialListItem } from 'src/app/modules/charts/essential-health-tile/essential-health-tile.component';
import { ClickableReplicaIdComponent } from '../clickable-replica-id/clickable-replica-id.component';
import { ReplicaDetailsHtmlComponent } from '../replica-details-html/replica-details-html.component';

// Custom column setting for clickable replica ID
export class ListColumnSettingForClickableReplicaId extends ListColumnSetting {
  template = ClickableReplicaIdComponent;
  clickHandler: (item: any) => void;
  
  public constructor(propertyPath: string, displayName: string, clickHandler?: (item: any) => void) {
    super(propertyPath, displayName);
    this.clickHandler = clickHandler;
  }
}

// Custom column setting for replica details HTML
export class ListColumnSettingForReplicaDetailsHtml extends ListColumnSetting {
  template = ReplicaDetailsHtmlComponent;
  
  public constructor(propertyPath: string, displayName: string, config?: any) {
    super(propertyPath, displayName, config);
  }
}

// Service configuration interface
interface ServiceConfig {
  name: string;
  applicationId: string;
  serviceId: string;
  partitionId: string;
}

// Service state interface
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
  listSettings: ListSettings;
  isLoaded: boolean;
}

@Component({
  selector: 'app-replica-list',
  templateUrl: './replica-list.component.html',
  styleUrls: ['./replica-list.component.scss']
})
export class ReplicaListComponent implements OnInit, OnDestroy {
  // Service configurations
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

  // Active tab
  activeTab: string = 'failover-manager';
  
  // Failover Manager state
  replicaData: any[] = [];
  minReplicaSetSize: number = 0;
  targetReplicaSetSize: number = 0;
  currentReplicaSetSize: number = 0;
  partitionStatus: string = '';
  lastQuorumLossDuration: string = '';
  writeQuorum: number = 0;
  showPreviousReplicaRole: boolean = true;
  highlightedReplicaCount: number = 0;
  quorumNeeded: number = 0;
  listSettings: ListSettings;
  failoverManagerEssentials: IEssentialListItem[] = [];

  // Cluster Manager state
  clusterManagerReplicaData: any[] = [];
  clusterManagerMinReplicaSetSize: number = 0;
  clusterManagerTargetReplicaSetSize: number = 0;
  clusterManagerCurrentReplicaSetSize: number = 0;
  clusterManagerPartitionStatus: string = '';
  clusterManagerLastQuorumLossDuration: string = '';
  clusterManagerWriteQuorum: number = 0;
  clusterManagerShowPreviousReplicaRole: boolean = true;
  clusterManagerHighlightedReplicaCount: number = 0;
  clusterManagerQuorumNeeded: number = 0;
  clusterManagerListSettings: ListSettings;
  private clusterManagerLoaded: boolean = false;
  
  // Track expansion state and loaded details across refreshes
  private expandedReplicasState = new Map<string, { isExpanded: boolean, details: any, detailsHtml: string }>();
  
  private refreshSubscription: Subscription;
  private readonly REFRESH_INTERVAL_NORMAL = 180000; // 3 minutes when healthy
  private readonly REFRESH_INTERVAL_QUORUM_LOSS = 5000; // 5 seconds when in quorum loss
  private currentRefreshInterval: number = this.REFRESH_INTERVAL_NORMAL;

  constructor(private restClientService: RestClientService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.setupListSettings('failover-manager');
    this.setupListSettings('cluster-manager');
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  // Called when tab changes
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
      ? this.showPreviousReplicaRole 
      : this.clusterManagerShowPreviousReplicaRole;

    const columnSettings = [
      new ListColumnSettingForClickableReplicaId('id', 'Replica Id', clickHandler),
      new ListColumnSettingWithFilter('role', 'Current Replica Role'),
      new ListColumnSettingForBadge('replicaStatusBadge', 'Status'),
      new ListColumnSettingForColoredNodeName('nodeName', 'Node Name'),
      new ListColumnSetting('lastSequenceNumber', 'Last Sequence Number')
    ];

    // Conditionally add Previous Replica Role column after Replica Id (index 1)
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
      this.listSettings = listSettings;
    } else {
      this.clusterManagerListSettings = listSettings;
    }
  }

  private startAutoRefresh(): void {
    this.refreshSubscription = interval(this.currentRefreshInterval)
      .pipe(
        startWith(0),
        switchMap(() => {
          // Always refresh failover manager
          const requests: any = {
            failoverManager: this.fetchServiceData(this.FAILOVER_MANAGER_CONFIG, 'failover-manager')
          };

          // Only refresh cluster manager if tab has been loaded
          if (this.clusterManagerLoaded) {
            requests.clusterManager = this.fetchServiceData(this.CLUSTER_MANAGER_CONFIG, 'cluster-manager');
          }

          return forkJoin(requests);
        })
      )
      .subscribe({
        error: (err) => console.error('Error in auto-refresh:', err)
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

    console.log('🔍 Loading Cluster Manager data for the first time...');
    this.clusterManagerLoaded = true;

    this.fetchServiceData(this.CLUSTER_MANAGER_CONFIG, 'cluster-manager')
      .subscribe({
        error: (err) => console.error('Error loading Cluster Manager:', err)
      });
  }

  private fetchServiceData(config: ServiceConfig, service: 'failover-manager' | 'cluster-manager'): Observable<any> {
    return forkJoin({
      replicas: this.restClientService.getReplicasOnPartition(config.applicationId, config.serviceId, config.partitionId),
      nodes: this.restClientService.getFMMNodes(),
      partition: this.restClientService.getPartition(config.applicationId, config.serviceId, config.partitionId)
    }).pipe(
      catchError(error => {
        console.error(`❌ Error fetching ${config.name} data:`, error);
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        console.error('URL:', error.url);
        return of(null);
      }),
      switchMap((result) => {
        if (!result) {
          console.log(`⚠️ Skipping ${config.name} processing due to error`);
          return of(null);
        }

        const { replicas, nodes, partition } = result;
        console.log(`✅ ${config.name} data fetched successfully`);

        // Process the data using common helper
        this.processServiceData(config, service, replicas, nodes, partition);

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
    // Extract partition info
    const minReplicaSetSize = partition.MinReplicaSetSize || 0;
    const targetReplicaSetSize = partition.TargetReplicaSetSize || 0;
    const partitionStatus = partition.PartitionStatus || '';
    const lastQuorumLossDuration = this.formatDuration(partition.LastQuorumLossDurationInSeconds || 0);

    // Check if all previous replica roles are None
    const allPreviousNone = replicas.every(replica => 
      replica.PreviousReplicaRole === 'None' || !replica.PreviousReplicaRole
    );

    const showPreviousReplicaRole = !allPreviousNone;

    // Calculate write quorum
    const writeQuorum = this.calculateWriteQuorum(replicas);
    const writeQuorumReplicaIds = this.getReplicaIdsCountedInWriteQuorum(replicas);

    // Create node maps
    const nodeStatusMap = new Map(nodes.map(node => [node.Name, node.NodeStatus]));
    const nodeSeedMap = new Map(nodes.map(node => [node.Name, node.IsSeedNode]));

    // Transform replicas to display format
    const replicaData = this.transformReplicas(
      replicas,
      writeQuorumReplicaIds,
      partitionStatus,
      nodeStatusMap,
      nodeSeedMap,
      config.partitionId
    );

    // Calculate metrics
    const highlightedReplicaCount = replicaData.filter(r => r.countsTowardWriteQuorum && r.replicaStatus !== 'Ready').length;
    const currentReplicaSetSize = replicaData.filter(r => r.countsTowardWriteQuorum).length;
    const readyReplicasInQuorum = replicaData.filter(r => r.countsTowardWriteQuorum && r.replicaStatus === 'Ready').length;
    const quorumNeeded = writeQuorum - readyReplicasInQuorum;

    // Update state based on service
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

    // Check if we need to adjust refresh interval
    this.updateRefreshInterval();

    // Fetch last sequence numbers for each replica
    this.fetchLastSequenceNumbers(replicaData, config.partitionId);
  }

  private updateFailoverManagerState(state: Partial<ServiceState>): void {
    const previousShowPreviousRole = this.showPreviousReplicaRole;
    
    Object.assign(this, state);
    
    // Re-setup list if column visibility changed
    if (previousShowPreviousRole !== this.showPreviousReplicaRole) {
      this.setupListSettings('failover-manager');
    }

    this.updateFailoverManagerEssentials();
  }

  private updateClusterManagerState(state: Partial<ServiceState>): void {
    const previousShowPreviousRole = this.clusterManagerShowPreviousReplicaRole;

    this.clusterManagerReplicaData = state.replicaData || [];
    this.clusterManagerMinReplicaSetSize = state.minReplicaSetSize || 0;
    this.clusterManagerTargetReplicaSetSize = state.targetReplicaSetSize || 0;
    this.clusterManagerCurrentReplicaSetSize = state.currentReplicaSetSize || 0;
    this.clusterManagerPartitionStatus = state.partitionStatus || '';
    this.clusterManagerLastQuorumLossDuration = state.lastQuorumLossDuration || '';
    this.clusterManagerWriteQuorum = state.writeQuorum || 0;
    this.clusterManagerShowPreviousReplicaRole = state.showPreviousReplicaRole || false;
    this.clusterManagerHighlightedReplicaCount = state.highlightedReplicaCount || 0;
    this.clusterManagerQuorumNeeded = state.quorumNeeded || 0;

    // Re-setup list if column visibility changed
    if (previousShowPreviousRole !== this.clusterManagerShowPreviousReplicaRole) {
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
      
      // Check if this replica was previously expanded
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
        // Restore expansion state if it existed
        isSecondRowCollapsed: previousState ? !previousState.isExpanded : true,
        // Restore loaded details if they existed
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
        error: (error) => {
          console.error(`Error fetching LastSequenceNumber for replica ${replicaItem.id}:`, error);
          replicaItem.lastSequenceNumber = 'Error';
        }
      });
    });
  }

  private updateRefreshInterval(): void {
    const hasQuorumLoss = 
      this.partitionStatus === 'InQuorumLoss' || 
      this.partitionStatus === 'Reconfiguring' ||
      this.clusterManagerPartitionStatus === 'InQuorumLoss' || 
      this.clusterManagerPartitionStatus === 'Reconfiguring';

    const newInterval = hasQuorumLoss 
      ? this.REFRESH_INTERVAL_QUORUM_LOSS 
      : this.REFRESH_INTERVAL_NORMAL;

    this.restartAutoRefreshWithNewInterval(newInterval);
  }

  private calculateWriteQuorum(replicas: any[]): number {
    const allPreviousNone = replicas.every(replica => 
      replica.PreviousReplicaRole === 'None' || !replica.PreviousReplicaRole
    );

    let n = 0;

    if (allPreviousNone) {
      n = replicas.filter(replica => 
        replica.ReplicaRole === 'ActiveSecondary' || replica.ReplicaRole === 'Primary'
      ).length;
    } else {
      n = replicas.filter(replica => 
        replica.PreviousReplicaRole === 'ActiveSecondary' || replica.PreviousReplicaRole === 'Primary'
      ).length;
    }

    return Math.floor(n / 2) + 1;
  }

  private getReplicaIdsCountedInWriteQuorum(replicas: any[]): Set<string> {
    const allPreviousNone = replicas.every(replica => 
      replica.PreviousReplicaRole === 'None' || !replica.PreviousReplicaRole
    );

    const replicaIds = new Set<string>();

    replicas.forEach(replica => {
      let countsTowardWriteQuorum = false;
      
      if (allPreviousNone) {
        countsTowardWriteQuorum = 
          replica.ReplicaRole === 'ActiveSecondary' || replica.ReplicaRole === 'Primary';
      } else {
        countsTowardWriteQuorum = 
          replica.PreviousReplicaRole === 'ActiveSecondary' || replica.PreviousReplicaRole === 'Primary';
      }

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

    if (this.partitionStatus === 'InQuorumLoss') {
      this.failoverManagerEssentials.push({
        descriptionName: 'Quorum Loss Duration',
        displayText: this.lastQuorumLossDuration,
        copyTextValue: this.lastQuorumLossDuration
      });
    }
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
    
    // Update the expansion state map
    if (!replicaItem.isSecondRowCollapsed) {
      // Expanding
      if (!replicaItem.deployedReplicaDetails) {
        this.loadDeployedReplicaDetails(replicaItem, config.partitionId);
      } else {
        // Already have details, just update the state map
        this.expandedReplicasState.set(replicaItem.id, {
          isExpanded: true,
          details: replicaItem.deployedReplicaDetails,
          detailsHtml: replicaItem.deployedReplicaDetailsHtml
        });
      }
    } else {
      // Collapsing - remove from map
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
        
        // Store in the expansion state map
        this.expandedReplicasState.set(replicaItem.id, {
          isExpanded: true,
          details: replicaItem.deployedReplicaDetails,
          detailsHtml: null // No longer needed
        });
      },
      error: (error) => {
        console.error('Error loading deployed replica details:', error);
        replicaItem.deployedReplicaDetails = { error: true };
        
        // Store error state as well
        this.expandedReplicasState.set(replicaItem.id, {
          isExpanded: true,
          details: replicaItem.deployedReplicaDetails,
          detailsHtml: null
        });
      }
    });
  }
}