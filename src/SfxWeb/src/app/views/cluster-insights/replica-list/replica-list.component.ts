import { Component, Injector } from '@angular/core';
import { forkJoin, of, Observable } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';

import { RestClientService } from 'src/app/services/rest-client.service';
import { DataService } from 'src/app/services/data.service';
import { Node } from 'src/app/Models/DataModels/Node';
import { ListSettings, ListColumnSettingWithFilter, ListColumnSettingForColoredNodeName, ListColumnSettingForBadge, ListColumnSetting } from 'src/app/Models/ListSettings';
import { ListColumnSettingForExpandedDetails } from '../expanded-details/expanded-details.component';
import { NodeStatusConstants, SortPriorities, PartitionStatusConstants, Constants } from 'src/app/Common/Constants';
import { isInReconfiguration, getQuorumReplicas, calculateWriteQuorum, getDownReplicaMitigationHint } from 'src/app/Utils/PartitionQuorumUtils';
import { IRawReplicaOnPartition } from 'src/app/Models/RawDataTypes';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';

interface ServiceConfig {
  applicationId: string;
  serviceId: string;
  partitionId: string;
}

interface ServiceState {
  replicaData: any[];
  replicaDisplayMap: Map<string, any>;
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

enum ServiceName {
  FailoverManager = 'failover-manager',
  ClusterManager = 'cluster-manager'
}

@Component({
    selector: 'app-replica-list',
    templateUrl: './replica-list.component.html',
    styleUrls: ['./replica-list.component.scss'],
    standalone: false
})
export class ReplicaListComponent extends BaseControllerDirective {
  readonly ServiceName = ServiceName;
  readonly PartitionStatus = PartitionStatusConstants;

  private readonly failoverManagerConfig: ServiceConfig = {
    applicationId: Constants.SystemAppId,
    serviceId: `${Constants.SystemAppTypeName}/${Constants.FailoverManagerServiceName}`,
    partitionId: Constants.FailoverManagerPartitionId
  };

  private readonly clusterManagerConfig: ServiceConfig = {
    applicationId: Constants.SystemAppId,
    serviceId: `${Constants.SystemAppTypeName}/${Constants.ClusterManagerServiceName}`,
    partitionId: Constants.ClusterManagerPartitionId
  };

  activeTab = ServiceName.FailoverManager;
  override fixedRefreshIntervalMs = 65000; // 65 seconds
  
  failoverManagerState: ServiceState = this.createDefaultServiceState();
  clusterManagerState: ServiceState = this.createDefaultServiceState();

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
      replicaDisplayMap: new Map<string, any>(),
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
    const defaultSortProperties = ['replicaRoleSortPriority', 'nodeName'];
    const columnSettings = [
      new ListColumnSetting('id', 'Replica Id'),
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
      (item) => item.isClickable,
      true,
      true  // showRowExpander
    );

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

    const newDisplayMap = new Map<string, any>();
    state.replicaData = replicas.map(replica => {
      const countsTowardWriteQuorum = quorumReplicas.has(replica.ReplicaId);
      const isDownAndCountsTowardQuorum = countsTowardWriteQuorum && replica.ReplicaStatus !== 'Ready';
      const node = nodeMap.get(replica.NodeName);
      const nodeStatus = node?.raw.NodeStatus || NodeStatusConstants.Unknown;

      const existing = state.replicaDisplayMap.get(replica.ReplicaId);
      if (existing) {
        existing.nodeName = replica.NodeName;
        existing.raw = replica;
        existing.nodeStatus = nodeStatus;
        existing.isSeedNode = node?.raw.IsSeedNode ?? false;
        existing.replicaRoleSortPriority = (SortPriorities.ReplicaRolesToSortPriorities as any)[replica.ReplicaRole] || 0;
        existing.replicaStatusBadge = {
          text: replica.ReplicaStatus,
          badgeClass: replica.ReplicaStatus === 'Ready' ? 'badge-ok' : 'badge-error'
        };
        existing.isClickable = replica.ReplicaStatus !== 'Down';
        if (replica.ReplicaStatus === 'Down') {
          existing.lastSequenceNumber = 'N/A';
          existing.expandedDetails = null;
        } else if (!existing.expandedDetails) {
          existing.lastSequenceNumber = 'Loading...';
        }
        existing.isDownAndCountsTowardQuorum = isDownAndCountsTowardQuorum;
        existing.infoMessage = partitionStatus === PartitionStatusConstants.InQuorumLoss && isDownAndCountsTowardQuorum ? getDownReplicaMitigationHint(nodeStatus) : '';
        newDisplayMap.set(replica.ReplicaId, existing);
        return existing;
      }

      const item = {
        id: replica.ReplicaId,
        nodeName: replica.NodeName,
        raw: replica,
        nodeStatus,
        isSeedNode: node?.raw.IsSeedNode ?? false,
        replicaRoleSortPriority: (SortPriorities.ReplicaRolesToSortPriorities as any)[replica.ReplicaRole] || 0,
        replicaStatusBadge: {
          text: replica.ReplicaStatus,
          badgeClass: replica.ReplicaStatus === 'Ready' ? 'badge-ok' : 'badge-error'
        },
        isSecondRowCollapsed: true,
        expandedDetails: null,
        lastSequenceNumber: replica.ReplicaStatus === 'Down' ? 'N/A' : 'Loading...',
        isClickable: replica.ReplicaStatus !== 'Down',
        isDownAndCountsTowardQuorum,
        infoMessage: partitionStatus === PartitionStatusConstants.InQuorumLoss && isDownAndCountsTowardQuorum ? getDownReplicaMitigationHint(nodeStatus) : ''
      };
      newDisplayMap.set(replica.ReplicaId, item);
      return item;
    });
    state.replicaDisplayMap = newDisplayMap;

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

    state.listSettings!.rowClass = (replica) =>
      partitionStatus === PartitionStatusConstants.InQuorumLoss && replica.isDownAndCountsTowardQuorum ? 'highlighted-row' : '';

    state.replicaData.forEach(replicaItem => this.loadDeployedReplicaDetails(replicaItem, config.partitionId));
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