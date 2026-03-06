import { Component, Injector } from '@angular/core';
import { forkJoin, of, Observable } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';

import { RestClientService } from 'src/app/services/rest-client.service';
import { ListSettings, ListColumnSettingWithFilter, ListColumnSettingForColoredNodeName, ListColumnSettingForBadge, ListColumnSetting } from 'src/app/Models/ListSettings';
import { ListColumnSettingWithExpandableLink } from '../expandable-link/expandable-link.component';
import { ListColumnSettingForExpandedDetails } from '../replica-details/replica-details.component';
import { NodeStatusConstants, ReplicaRoles, SortPriorities, PartitionStatusConstants } from 'src/app/Common/Constants';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';

interface ServiceConfig {
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
  isInReconfiguration: boolean;
  downReplicasInQuorum: number; // Number of replicas counted toward write quorum that are not in Ready state. This identifies which replicas to focus on for partition recovery.
  quorumNeeded: number;
  listSettings?: ListSettings;
  isLoading: boolean;
}

class ServiceName {
  static FailoverManager = 'failover-manager';
  static ClusterManager = 'cluster-manager';
}

@Component({
  selector: 'app-replica-list',
  templateUrl: './replica-list.component.html',
  styleUrls: ['./replica-list.component.scss']
})
export class ReplicaListComponent extends BaseControllerDirective {
  readonly ServiceName = ServiceName;
  readonly PartitionStatus = PartitionStatusConstants;

  private readonly failoverManagerConfig: ServiceConfig = {
    applicationId: 'System',
    serviceId: 'System/FailoverManagerService',
    partitionId: '00000000-0000-0000-0000-000000000001'
  };

  private readonly clusterManagerConfig: ServiceConfig = {
    applicationId: 'System',
    serviceId: 'System/ClusterManagerService',
    partitionId: '00000000-0000-0000-0000-000000002000'
  };

  activeTab = ServiceName.FailoverManager;
  override fixedRefreshIntervalMs = 60000; // 60 seconds
  
  failoverManagerState: ServiceState = this.createDefaultServiceState();
  clusterManagerState: ServiceState = this.createDefaultServiceState();

  private expandedReplicasState = new Map<string, boolean>();

  private getServiceState(service: string): ServiceState {
    return service === ServiceName.FailoverManager ? this.failoverManagerState : this.clusterManagerState;
  }

  private setServiceState(service: string, state: ServiceState): void {
    if (service === ServiceName.FailoverManager) {
      this.failoverManagerState = state;
    } else {
      this.clusterManagerState = state;
    }
  }

  constructor(private restClientService: RestClientService, injector: Injector) {
    super(injector);
  }

  setup(): void {
    this.setupReplicaList(ServiceName.FailoverManager);
    this.setupReplicaList(ServiceName.ClusterManager);
  }

  refresh(): Observable<any> {
    return this.restClientService.getNodes().pipe(
      catchError(() => of([])),
      switchMap(nodes => forkJoin({
        failoverManager: this.fetchServiceData(this.failoverManagerConfig, ServiceName.FailoverManager, nodes),
        clusterManager: this.fetchServiceData(this.clusterManagerConfig, ServiceName.ClusterManager, nodes)
      }))
    );
  }

  private createDefaultServiceState(): ServiceState {
    return {
      replicaData: [],
      minReplicaSetSize: 0,
      targetReplicaSetSize: 0,
      currentReplicaSetSize: 0,
      partitionStatus: '',
      lastQuorumLossDuration: '',
      writeQuorum: 0,
      isInReconfiguration: false,
      downReplicasInQuorum: 0,
      quorumNeeded: 0,
      isLoading: true
    };
  }

  private setupReplicaList(service: string): void {
    const clickHandler = this.handleReplicaClick.bind(this);

    const defaultSortProperties = ['replicaRoleSortPriority', 'nodeName'];
    const columnSettings = [
      new ListColumnSettingWithExpandableLink('id', 'Replica Id', clickHandler),
      new ListColumnSettingWithFilter('raw.ReplicaRole', 'Replica Role', {sortPropertyPaths: defaultSortProperties}),
      new ListColumnSettingForBadge('replicaStatusBadge', 'Status'),
      new ListColumnSettingForColoredNodeName('nodeName', 'Node Name'),
      new ListColumnSetting('lastSequenceNumber', 'Last Sequence Number')
    ];

    // During reconfiguration, the replica role that counts toward write quorum is calculated based on PreviousReplicaRole.
    const isInReconfiguration = this.getServiceState(service).isInReconfiguration;
    if (isInReconfiguration) {
      columnSettings.splice(1, 0, new ListColumnSettingWithFilter('raw.PreviousReplicaRole', 'Previous Replica Role'));
    }

    const secondRowColumnSettings = [
      new ListColumnSettingForExpandedDetails('deployedReplicaDetails', 'Deployed Replica Details', { colspan: -1 })
    ];

    const listSettings = new ListSettings(
      15,
      defaultSortProperties,
      'replicas',
      columnSettings,
      secondRowColumnSettings,
      true,
      (item) => item.isClickable && item.deployedReplicaDetails !== null,
      true,
      false
    );

    // Sorting using lower priority number first. Primary=2 sorts before ActiveSecondary=3, which is the desired order.
    listSettings.sortReverse = true;

    this.getServiceState(service).listSettings = listSettings;
  }

  private fetchServiceData(config: ServiceConfig, service: string, nodes: any[]): Observable<any> {
    this.getServiceState(service).isLoading = true;

    return forkJoin({
      replicas: this.restClientService.getReplicasOnPartition(config.applicationId, config.serviceId, config.partitionId),
      partition: this.restClientService.getPartition(config.applicationId, config.serviceId, config.partitionId)
    }).pipe(
      catchError(() => {
        this.getServiceState(service).isLoading = false;
        return of(null);
      }),
      map(result => {
        if (!result) {
          return null;
        }

        const { replicas, partition } = result;
        this.processServiceReplicas(config, service, replicas, nodes, partition);

        return result;
      })
    );
  }

  private processServiceReplicas(
    config: ServiceConfig,
    service: string,
    replicas: any[],
    nodes: any[],
    partition: any
  ): void {
    const minReplicaSetSize = partition.MinReplicaSetSize ?? 0;
    const targetReplicaSetSize = partition.TargetReplicaSetSize ?? 0;
    const partitionStatus = partition.PartitionStatus ?? '';
    const lastQuorumLossDuration = this.formatDuration(partition.LastQuorumLossDurationInSeconds ?? 0);

    const { isInReconfiguration, writeQuorum, quorumReplicas } = this.calculateWriteQuorum(replicas);

    const nodeStatusMap = new Map(nodes.map(node => [node.Name, node.NodeStatus]));

    const replicaData = replicas.map(replica => {
      const countsTowardWriteQuorum = quorumReplicas.has(replica.ReplicaId);
      const isDownAndCountsTowardQuorum = countsTowardWriteQuorum && replica.ReplicaStatus !== 'Ready';
      const nodeStatus = nodeStatusMap.get(replica.NodeName) ?? NodeStatusConstants.Unknown;

      return {
        id: replica.ReplicaId,
        nodeName: replica.NodeName,
        raw: {
          ...replica,
          NodeStatus: nodeStatus
        },
        replicaRoleSortPriority: SortPriorities.ReplicaRolesToSortPriorities[replica.ReplicaRole] || 0,
        replicaStatusBadge: {
          text: replica.ReplicaStatus,
          badgeClass: replica.ReplicaStatus === 'Ready' ? 'badge-ok' : 'badge-error'
        },
        isSecondRowCollapsed: !(this.expandedReplicasState.get(replica.ReplicaId) ?? false),
        deployedReplicaDetails: null,
        lastSequenceNumber: replica.ReplicaStatus === 'Down' ? 'N/A' : 'Loading...',
        isClickable: replica.ReplicaStatus !== 'Down',
        isDownAndCountsTowardQuorum,
        infoMessage: partitionStatus === PartitionStatusConstants.InQuorumLoss && isDownAndCountsTowardQuorum ? this.getReplicaInfoMessage(nodeStatus) : '',
        cssClass: (partitionStatus === PartitionStatusConstants.InQuorumLoss && isDownAndCountsTowardQuorum) ? 'highlighted-row' : ''
      };
    });

    const currentReplicaSetSize = quorumReplicas.size;
    const downReplicasInQuorum = replicaData.filter(r => r.isDownAndCountsTowardQuorum).length;
    const quorumNeeded = writeQuorum - (currentReplicaSetSize - downReplicasInQuorum);

    const updatedState = {
      replicaData,
      minReplicaSetSize,
      targetReplicaSetSize,
      currentReplicaSetSize,
      partitionStatus,
      lastQuorumLossDuration,
      writeQuorum,
      isInReconfiguration,
      downReplicasInQuorum,
      quorumNeeded,
      isLoading: false
    };

    this.setServiceState(service, { ...this.getServiceState(service), ...updatedState });

    this.setupReplicaList(service);

    replicaData.forEach(replicaItem => this.loadDeployedReplicaDetails(replicaItem, config.partitionId));
  }

  private calculateWriteQuorum(replicas: any[]): { isInReconfiguration: boolean; writeQuorum: number; quorumReplicas: Set<string> } {
    const isInReconfiguration = !replicas.every(replica =>
      replica.PreviousReplicaRole === ReplicaRoles.None
    );

    const writeQuorumReplicaIds = new Set<string>();
    let count = 0;

    replicas.forEach(replica => {
      const countsTowardWriteQuorum = isInReconfiguration
        ? replica.PreviousReplicaRole === ReplicaRoles.ActiveSecondary || replica.PreviousReplicaRole === ReplicaRoles.Primary
        : replica.ReplicaRole === ReplicaRoles.ActiveSecondary || replica.ReplicaRole === ReplicaRoles.Primary;

      if (countsTowardWriteQuorum) {
        writeQuorumReplicaIds.add(replica.ReplicaId);
        count++;
      }
    });

    const writeQuorum = Math.floor(count / 2) + 1;

    return { isInReconfiguration, writeQuorum, quorumReplicas: writeQuorumReplicaIds };
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

  private getReplicaInfoMessage(nodeStatus: string): string {
    if (nodeStatus === NodeStatusConstants.Down) {
      return 'Node is down, try restarting the node or restarting the vm';
    } else if (nodeStatus === NodeStatusConstants.Disabling || nodeStatus === NodeStatusConstants.Disabled) {
      return 'Please check why the node is in deactivated state, enable it if possible';
    } else if (nodeStatus === NodeStatusConstants.Up) {
      return 'The replica is down, try restarting the replica if possible';
    }

    return '';
  }

  private handleReplicaClick(replicaItem: any): void {
    if (!replicaItem.isClickable) {
      return;
    }
    
    replicaItem.isSecondRowCollapsed = !replicaItem.isSecondRowCollapsed;
    this.expandedReplicasState.set(replicaItem.id, !replicaItem.isSecondRowCollapsed);
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
        replicaItem.lastSequenceNumber = lastSeqNum != null ? lastSeqNum.toString() : 'N/A';
      },
      error: () => {
        replicaItem.deployedReplicaDetails = { error: true };
        replicaItem.lastSequenceNumber = 'Error';
      }
    });
  }
}