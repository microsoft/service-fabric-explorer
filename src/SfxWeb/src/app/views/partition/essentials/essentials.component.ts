import { Component, Injector } from '@angular/core';
import { ListSettings, ListColumnSettingForLink, ListColumnSetting, ListColumnSettingWithFilter, ListColumnSettingForBadge } from 'src/app/Models/ListSettings';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable, forkJoin } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PartitionBaseControllerDirective } from '../PartitionBase';
import { IEssentialListItem } from 'src/app/modules/charts/essential-health-tile/essential-health-tile.component';
import { ReplicaRoles } from 'src/app/Common/Constants';
import { ReplicaOnPartition } from 'src/app/Models/DataModels/Replica';

@Component({
  selector: 'app-essentials',
  templateUrl: './essentials.component.html',
  styleUrls: ['./essentials.component.scss']
})
export class EssentialsComponent extends PartitionBaseControllerDirective {

  public hideReplicator = true;
  listSettings: ListSettings;

  essentialItems: IEssentialListItem[] = [];
  writeQuorum = 0;
  quorumNeeded = 0;
  isInReconfiguration = false;
  quorumLossDuration: number = 0;
  downReplicasInQuorum = 0;
  currentReplicaSetSize = 0;

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
        new ListColumnSettingWithFilter('raw.NodeName', 'Node Name'),
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
      if (this.partition.raw.PartitionStatus === 'InQuorumLoss' || this.partition.raw.PartitionStatus === 'Reconfiguring') {
        columnSettings.splice(3, 0, new ListColumnSetting('raw.PreviousReplicaRole', 'Previous Replica Role'));
      }
    }
    
    // ListSettings persists across navigation, so we need to use different settings name, so they can have different column configurations
    const settingsName = this.partition.isSelfReconfiguringService ? 'replicas-selfreconfiguring' 
                    : this.partition.isStatelessService ? 'replicas-stateless'
                    : 'replicas-stateful';
    
    // Keep the sort properties in sync with the sortBy for ClusterTreeService.getDeployedReplicas
    this.listSettings = this.settings.getNewOrExistingListSettings(settingsName, defaultSortProperties, columnSettings);

    return forkJoin([
      this.partition.health.refresh(messageHandler),
      this.partition.replicas.refresh(messageHandler)
    ]).pipe(
      tap(() => {
        if (this.partition.isStatefulService) {
          this.processStatefulPartitionReplicas();
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

  private processStatefulPartitionReplicas(): void {
    if (!this?.partition?.partitionInformation.isInitialized) {
      return;
    }

    const quorumReplicas = this.calculateWriteQuorum(this.partition.replicas.collection);
    const isInQuorumLoss = this.partition.raw.PartitionStatus === 'InQuorumLoss';
    this.currentReplicaSetSize = quorumReplicas.size;

    this.quorumLossDuration = this.partition.raw.LastQuorumLossDurationInSeconds * 1000;

    this.downReplicasInQuorum = this.partition.replicas.collection.filter(r =>
      quorumReplicas.has(r.id) && r.raw.ReplicaStatus !== 'Ready'
    ).length;

    this.quorumNeeded = Math.max(0, this.writeQuorum - (quorumReplicas.size - this.downReplicasInQuorum));

    this.listSettings.rowClass = (replica) =>
      isInQuorumLoss && quorumReplicas.has(replica.id) && replica.raw.ReplicaStatus !== 'Ready' ? 'highlighted-row' : '';
  }

  private calculateWriteQuorum(replicas: ReplicaOnPartition[]): Set<string> {
    this.isInReconfiguration = !replicas.every(replica =>
      replica.raw.PreviousReplicaRole === ReplicaRoles.None
    );

    const writeQuorumReplicaIds = new Set<string>();
    let count = 0;

    replicas.forEach(replica => {
      const role = this.isInReconfiguration ? replica.raw.PreviousReplicaRole : replica.raw.ReplicaRole;
      if (role === ReplicaRoles.ActiveSecondary || role === ReplicaRoles.Primary) {
        writeQuorumReplicaIds.add(replica.id);
        count++;
      }
    });

    this.writeQuorum = Math.floor(count / 2) + 1;

    return writeQuorumReplicaIds;
  }

}
