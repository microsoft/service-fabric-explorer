import { Component, Injector } from '@angular/core';
import { ListSettings, ListColumnSettingForLink, ListColumnSetting, ListColumnSettingWithFilter, ListColumnSettingForBadge, ListColumnSettingForColoredNodeName } from 'src/app/Models/ListSettings';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable, forkJoin } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PartitionBaseControllerDirective } from '../PartitionBase';
import { NodeStatusConstants, PartitionStatusConstants } from 'src/app/Common/Constants';
import { getDownReplicaMitigationHint } from 'src/app/Utils/PartitionQuorumUtils';
import { Node } from 'src/app/Models/DataModels/Node';
import { IEssentialListItem } from 'src/app/modules/charts/essential-health-tile/essential-health-tile.component';


@Component({
  selector: 'app-essentials',
  templateUrl: './essentials.component.html',
  styleUrls: ['./essentials.component.scss']
})
export class EssentialsComponent extends PartitionBaseControllerDirective {

  public hideReplicator = true;
  listSettings: ListSettings;
  replicaViewModels: any[] = [];

  essentialItems: IEssentialListItem[] = [];

  constructor(protected data: DataService, injector: Injector, private settings: SettingsService) {
    super(data, injector);
  }

  setup() {
    this.setEssentialData();
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    this.setEssentialData();
    
    let defaultSortProperties = ['replicaRoleSortPriority', 'raw.NodeName'];
    const columnSettings = [
        new ListColumnSettingForLink('id', 'Id', item => item.viewPath),
        new ListColumnSettingForColoredNodeName('raw.NodeName', 'Node Name'),
        new ListColumnSettingWithFilter('role', 'Replica Role', {sortPropertyPaths: defaultSortProperties}),
        new ListColumnSettingForBadge('healthState', 'Health State'),
        new ListColumnSettingWithFilter('raw.ReplicaStatus', 'Status')
    ];
    
    if (this.partition.isStatelessService) {
        columnSettings.splice(2, 1); // Remove replica role column
        defaultSortProperties = ['raw.NodeName'];
    }

    // Add Activation State column for Self Reconfiguring Services
    if (this.partition.isSelfReconfiguringService) {
        columnSettings.splice(3, 0, new ListColumnSetting('activationState', 'Activation State'));
    }
    
    if (this.partition.isStatefulService) {
      // Add Previous Replica Role column only when stateful partition is in quorum loss or reconfiguring
      if (this.partition.raw.PartitionStatus === PartitionStatusConstants.InQuorumLoss || this.partition.raw.PartitionStatus === PartitionStatusConstants.Reconfiguring) {
        columnSettings.splice(2, 0, new ListColumnSetting('raw.PreviousReplicaRole', 'Previous Replica Role'));
      }
    }

    // ListSettings persists across navigation, so we need to use different settings name, so they can have different column configurations
    const settingsName = this.partition.isSelfReconfiguringService ? 'replicas-selfreconfiguring' 
                    : this.partition.isStatelessService ? 'replicas-stateless'
                    : 'replicas-stateful';
    
    // Keep the sort properties in sync with the sortBy for ClusterTreeService.getDeployedReplicas
    this.listSettings = this.settings.getNewOrExistingListSettings(settingsName, defaultSortProperties, columnSettings);

    return forkJoin({
      health: this.partition.health.refresh(messageHandler),
      replicas: this.partition.replicas.refresh(messageHandler),
      nodes: this.data.getNodes(false, messageHandler)
    }).pipe(
      tap(({ nodes }) => {
        const nodeMap = new Map<string, Node>(nodes.collection.map(n => [n.name, n]));
        const inQuorumLoss = this.partition.isStatefulService && this.partition.raw.PartitionStatus === PartitionStatusConstants.InQuorumLoss;

        this.replicaViewModels = this.partition.replicas.collection.map(replica => {
          const node = nodeMap.get(replica.raw.NodeName);
          const nodeStatus = node?.raw.NodeStatus || NodeStatusConstants.Unknown;
          const isDownAndCountsTowardQuorum = inQuorumLoss
            && this.partition.quorumReplicas.has(replica.id)
            && replica.raw.ReplicaStatus !== 'Ready';

          const replicaView = Object.create(replica);
          replicaView.nodeStatus = nodeStatus;
          replicaView.isSeedNode = node?.raw.IsSeedNode ?? false;
          replicaView.infoMessage = isDownAndCountsTowardQuorum ? getDownReplicaMitigationHint(nodeStatus) : '';
          return replicaView;
        });

        // Highlight the replicas that need to be brought back up to get the partition out of quorum loss
        if (inQuorumLoss) {
          this.listSettings.rowClass = (replicaView) =>
            this.partition.quorumReplicas.has(replicaView.id) && replicaView.raw.ReplicaStatus !== 'Ready'
              ? 'highlighted-row' : '';
        }
      })
    );
  }

  setEssentialData() {
    this.essentialItems = [];

    if (!this?.partition?.partitionInformation.isInitialized) {
      return;
    }

    this.essentialItems = [
      {
        descriptionName: 'Status',
        displayText: this.partition.raw.PartitionStatus,
        copyTextValue: this.partition.raw.PartitionStatus,
        selectorName: 'status',
        displaySelector: true
      },
      {
        descriptionName: 'Partition Kind',
        displayText: this.partition.partitionInformation.raw.ServicePartitionKind,
        copyTextValue: this.partition.partitionInformation.raw.ServicePartitionKind,
      }
    ];

    if (this.partition.isStatefulService) {

      if (this.partition.partitionInformation.isPartitionKindInt64Range) {
        this.essentialItems.push({
          descriptionName: 'High Key',
          displayText: this.partition.partitionInformation.raw.HighKey,
          copyTextValue: this.partition.partitionInformation.raw.HighKey
        });
        this.essentialItems.push({
          descriptionName: 'Low Key',
          displayText: this.partition.partitionInformation.raw.LowKey,
          copyTextValue: this.partition.partitionInformation.raw.LowKey
        });
      }

      if (this.partition.partitionInformation.isPartitionKindNamed) {
        this.essentialItems.push({
          descriptionName: 'Name',
          displayText: this.partition.partitionInformation.raw.Name,
          copyTextValue: this.partition.partitionInformation.raw.Name
        });
      }

    }

  }
}
