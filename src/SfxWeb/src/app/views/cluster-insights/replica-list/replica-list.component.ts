import { Component, OnInit, OnDestroy } from '@angular/core';
import { RestClientService } from 'src/app/services/rest-client.service';
import { ListSettings, ListColumnSettingWithFilter, ListColumnSettingForColoredNodeName, ListColumnSettingForBadge, ListColumnSetting } from 'src/app/Models/ListSettings';
import { forkJoin, interval, Subscription } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';
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
  showPreviousReplicaRole: boolean = true;
  
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
      new ListColumnSettingForClickableReplicaId('id', 'Replica Id', this.handleReplicaIdClick.bind(this)),
      new ListColumnSettingWithFilter('role', 'Current Replica Role'),
      new ListColumnSettingForBadge('replicaStatusBadge', 'Status'),
      new ListColumnSettingForColoredNodeName('nodeName', 'Node Name'),
      new ListColumnSetting('lastSequenceNumber', 'Last Sequence Number')
    ];

    const secondRowColumnSettings = [
      new ListColumnSettingForReplicaDetailsHtml('deployedReplicaDetailsHtml', 'Deployed Replica Details', { colspan: -1 })
    ];

    // Conditionally add Previous Replica Role column after Replica Id (index 1)
    if (this.showPreviousReplicaRole) {
      columnSettings.splice(1, 0, new ListColumnSettingWithFilter('previousReplicaRole', 'Previous Replica Role'));
    }

    this.listSettings = new ListSettings(10, null, 'replicas', columnSettings, secondRowColumnSettings, true, (item) => item.deployedReplicaDetails !== null);
  }

  getRoleOrder(role: string): number {
    const roleOrder: { [key: string]: number } = {
      'Primary': 1,
      'ActiveSecondary': 2,
      'IdleSecondary': 3,
      'None': 4
    };
    return roleOrder[role] || 999;
  }

  sortReplicasByRole(replicas: any[]): any[] {
    return replicas.sort((a, b) => {
      const orderA = this.getRoleOrder(a.role);
      const orderB = this.getRoleOrder(b.role);
      return orderA - orderB;
    });
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
        descriptionName: 'Quorum Loss Duration',
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

        // Check if all previous replica roles are None
        const allPreviousNone = replicas.every(replica => 
          replica.PreviousReplicaRole === 'None' || !replica.PreviousReplicaRole
        );

        // Update showPreviousReplicaRole flag
        const previousShowPreviousReplicaRole = this.showPreviousReplicaRole;
        this.showPreviousReplicaRole = !allPreviousNone;

        // Re-setup list if the column visibility changed
        if (previousShowPreviousReplicaRole !== this.showPreviousReplicaRole) {
          this.setupReplicaList();
        }

        // Calculate write quorum
        this.writeQuorum = this.calculateWriteQuorum(replicas);

        // Update essential items
        this.updateFailoverManagerEssentials();

        if (this.partitionStatus === 'InQuorumLoss' || this.partitionStatus === 'Reconfiguring') {
          this.restartAutoRefreshWithNewInterval(this.REFRESH_INTERVAL_QUORUM_LOSS);
        } else {
          this.restartAutoRefreshWithNewInterval(this.REFRESH_INTERVAL_NORMAL);
        }

        const nodeStatusMap = new Map(nodes.map(node => [node.Name, node.NodeStatus]));

        // Create initial replica data
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
          },
          isSecondRowCollapsed: true,
          deployedReplicaDetails: null,
          lastSequenceNumber: 'Loading...'
        }));

        // Sort replicas by role
        this.replicaData = this.sortReplicasByRole(this.replicaData);

        // Fetch LastSequenceNumber for each replica independently
        this.replicaData.forEach((replicaItem, index) => {
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

  handleReplicaIdClick(replicaItem: any): void {
    // Toggle the row
    replicaItem.isSecondRowCollapsed = !replicaItem.isSecondRowCollapsed;
    
    // Load data if expanding and not already loaded
    if (!replicaItem.isSecondRowCollapsed && !replicaItem.deployedReplicaDetails) {
      this.loadDeployedReplicaDetails(replicaItem);
    }
  }

  loadDeployedReplicaDetails(replicaItem: any): void {
    // If already loaded, just toggle
    if (replicaItem.deployedReplicaDetails) {
      return;
    }

    const partitionId = '00000000-0000-0000-0000-000000000001';
    
    this.restClientService.getDeployedReplicaDetail(
      replicaItem.nodeName,
      partitionId,
      replicaItem.id
    ).subscribe({
      next: (details: any) => {
        console.log('Full API Response:', details);
        
        // Store the full response for inspection
        replicaItem.deployedReplicaDetails = details;
        
        // Extract the required fields
        const deployedServiceReplica = details.DeployedServiceReplica || {};
        const reconfigInfo = details.ReconfigurationInformation || deployedServiceReplica.ReconfigurationInformation || {};
        
        // Create simple key-value display
        const fields = [
          { key: 'Host Process ID', value: deployedServiceReplica.HostProcessId || details.HostProcessId || 'N/A' },
          { key: 'Previous Configuration Role', value: reconfigInfo.PreviousConfigurationRole || 'None' },
          { key: 'Previous Self Reconfiguring Configuration Role', value: reconfigInfo.PreviousSelfReconfiguringConfigurationRole || 'SelfReconfiguringNone' },
          { key: 'Reconfiguration Phase', value: reconfigInfo.ReconfigurationPhase || 'None' },
          { key: 'Reconfiguration Type', value: reconfigInfo.ReconfigurationType || 'None' },
          { key: 'Reconfiguration Start Time UTC', value: reconfigInfo.ReconfigurationStartTimeUtc || '0001-01-01T00:00:00.000Z' }
        ];
        
        // Format as HTML table
        let html = '<table class="replica-details-table">';
        fields.forEach(field => {
          html += `<tr><td class="field-name">${field.key}</td><td class="field-value">${field.value}</td></tr>`;
        });
        html += '</table>';
        
        replicaItem.deployedReplicaDetailsHtml = html;
        
        console.log('Extracted fields:', fields);
      },
      error: (error) => {
        console.error('Error loading deployed replica details:', error);
        replicaItem.deployedReplicaDetails = { error: true };
        replicaItem.deployedReplicaDetailsHtml = '<div class="error-message">Failed to load details: ' + (error.message || 'Unknown error') + '</div>';
      }
    });
  }
}