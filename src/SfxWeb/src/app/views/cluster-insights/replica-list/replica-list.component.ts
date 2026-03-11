import { Component, Injector } from '@angular/core';
import { forkJoin, of, Observable } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';

import { RestClientService } from 'src/app/services/rest-client.service';
import { DataService } from 'src/app/services/data.service';
import { Node } from 'src/app/Models/DataModels/Node';
import { ListSettings, ListColumnSettingWithFilter, ListColumnSettingForColoredNodeName, ListColumnSettingForBadge, ListColumnSetting } from 'src/app/Models/ListSettings';
import { ListColumnSettingWithExpandableLink } from '../expandable-link/expandable-link.component';
import { ListColumnSettingForExpandedDetails } from '../expanded-details/expanded-details.component';
import { NodeStatusConstants, SortPriorities, PartitionStatusConstants, Constants } from 'src/app/Common/Constants';
import { isInReconfiguration, getQuorumReplicas, calculateWriteQuorum } from 'src/app/Utils/PartitionQuorumUtils';
import { IRawReplicaOnPartition } from 'src/app/Models/RawDataTypes';
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
  lastQuorumLossDuration: number;
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
    applicationId: Constants.SystemAppId,
    serviceId: `${Constants.SystemAppId}/${Constants.FailoverManagerServiceName}`,
    partitionId: Constants.FailoverManagerPartitionId
  };

  private readonly clusterManagerConfig: ServiceConfig = {
    applicationId: Constants.SystemAppId,
    serviceId: `${Constants.SystemAppId}/${Constants.ClusterManagerServiceName}`,
    partitionId: Constants.ClusterManagerPartitionId
  };

  activeTab = ServiceName.FailoverManager;
  override fixedRefreshIntervalMs = 65000; // 65 seconds
  
  failoverManagerState: ServiceState = this.createDefaultServiceState();
  clusterManagerState: ServiceState = this.createDefaultServiceState();

  private expandedReplicasState = new Map<string, boolean>();

  private getServiceState(service: string): ServiceState {
    return service === ServiceName.FailoverManager ? this.failoverManagerState : this.clusterManagerState;
  }

  constructor(private restClientService: RestClientService, private dataService: DataService, injector: Injector) {
    super(injector);
  }

  setup(): void {
    this.setupReplicaList(ServiceName.FailoverManager);
    this.setupReplicaList(ServiceName.ClusterManager);
  }

  refresh(): Observable<any> {
    return this.dataService.getNodes(true).pipe(
      map(nodeCollection => nodeCollection.collection),
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
      lastQuorumLossDuration: 0,
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
    const inReconfiguration = this.getServiceState(service).isInReconfiguration;
    if (inReconfiguration) {
      columnSettings.splice(1, 0, new ListColumnSettingWithFilter('raw.PreviousReplicaRole', 'Previous Replica Role'));
    }

    const secondRowColumnSettings = [
      new ListColumnSettingForExpandedDetails('Deployed Replica Details', { colspan: -1 })
    ];

    const listSettings = new ListSettings(
      15,
      defaultSortProperties,
      'replicas',
      columnSettings,
      secondRowColumnSettings,
      true,
      (item) => item.isClickable && item.expandedDetails !== null,
      true,
      false
    );

    // Sorting using lower priority number first. Primary=2 sorts before ActiveSecondary=3, which is the desired order.
    listSettings.sortReverse = true;

    this.getServiceState(service).listSettings = listSettings;
  }

  private fetchServiceData(config: ServiceConfig, service: string, nodes: Node[]): Observable<any> {
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
    replicas: IRawReplicaOnPartition[],
    nodes: Node[],
    partition: any
  ): void {
    const state = this.getServiceState(service);
    const partitionStatus = partition.PartitionStatus ?? '';

    const inReconfiguration = isInReconfiguration(replicas);
    const quorumReplicas = getQuorumReplicas(replicas);
    const writeQuorum = calculateWriteQuorum(replicas);

    const nodeMap = new Map(nodes.map(node => [node.name, node]));

    state.replicaData = replicas.map(replica => {
      const countsTowardWriteQuorum = quorumReplicas.has(replica.ReplicaId);
      const isDownAndCountsTowardQuorum = countsTowardWriteQuorum && replica.ReplicaStatus !== 'Ready';
      const node = nodeMap.get(replica.NodeName);
      const nodeStatus = node?.raw.NodeStatus || NodeStatusConstants.Unknown;

      return {
        id: replica.ReplicaId,
        nodeName: replica.NodeName,
        raw: {
          ...replica,
          NodeStatus: nodeStatus,
          IsSeedNode: node?.raw.IsSeedNode
        },
        replicaRoleSortPriority: SortPriorities.ReplicaRolesToSortPriorities[replica.ReplicaRole] || 0,
        replicaStatusBadge: {
          text: replica.ReplicaStatus,
          badgeClass: replica.ReplicaStatus === 'Ready' ? 'badge-ok' : 'badge-error'
        },
        isSecondRowCollapsed: !(this.expandedReplicasState.get(replica.ReplicaId) ?? false),
        expandedDetails: null,
        lastSequenceNumber: replica.ReplicaStatus === 'Down' ? 'N/A' : 'Loading...',
        isClickable: replica.ReplicaStatus !== 'Down',
        isDownAndCountsTowardQuorum,
        infoMessage: partitionStatus === PartitionStatusConstants.InQuorumLoss && isDownAndCountsTowardQuorum ? this.getReplicaInfoMessage(nodeStatus) : ''
      };
    });

    state.minReplicaSetSize = partition.MinReplicaSetSize ?? 0;
    state.targetReplicaSetSize = partition.TargetReplicaSetSize ?? 0;
    state.currentReplicaSetSize = quorumReplicas.size;
    state.partitionStatus = partitionStatus;
    state.lastQuorumLossDuration = partition.LastQuorumLossDurationInSeconds * 1000;
    state.writeQuorum = writeQuorum;
    state.isInReconfiguration = inReconfiguration;
    state.downReplicasInQuorum = state.replicaData.filter(r => r.isDownAndCountsTowardQuorum).length;
    state.quorumNeeded = Math.max(0, writeQuorum - (state.currentReplicaSetSize - state.downReplicasInQuorum));
    state.isLoading = false;

    this.setupReplicaList(service);

    state.listSettings.rowClass = (replica) =>
      partitionStatus === PartitionStatusConstants.InQuorumLoss && replica.isDownAndCountsTowardQuorum ? 'highlighted-row' : '';

    state.replicaData.forEach(replicaItem => this.loadDeployedReplicaDetails(replicaItem, config.partitionId));
  }

  private getReplicaInfoMessage(nodeStatus: string): string {
    if (nodeStatus === NodeStatusConstants.Down) {
      return 'Node is down, try to bring it back up';
    } else if (nodeStatus === NodeStatusConstants.Disabling || nodeStatus === NodeStatusConstants.Disabled) {
      return 'Node is in deactivated state, enable it if possible';
    } else if (nodeStatus === NodeStatusConstants.Up) {
      return 'Node is up but replica is not Ready, try restarting the replica';
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
        const deployedServiceReplica = details?.DeployedServiceReplica || {};
        const reconfigInfo = deployedServiceReplica.ReconfigurationInformation || {};
        replicaItem.expandedDetails = {
          'Host Process ID': deployedServiceReplica.HostProcessId || '',
          'Previous Configuration Role': reconfigInfo.PreviousConfigurationRole || '',
          'Reconfiguration Phase': reconfigInfo.ReconfigurationPhase || '',
          'Reconfiguration Type': reconfigInfo.ReconfigurationType || '',
          'Reconfiguration Start Time UTC': reconfigInfo.ReconfigurationStartTimeUtc || ''
        };
        const lastSeqNum = details?.ReplicatorStatus?.ReplicationQueueStatus?.LastSequenceNumber;
        replicaItem.lastSequenceNumber = lastSeqNum != null ? lastSeqNum.toString() : 'N/A';
      },
      error: () => {
        replicaItem.expandedDetails = null;
        replicaItem.lastSequenceNumber = 'Error';
      }
    });
  }
}