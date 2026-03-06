import { Component, Injector } from '@angular/core';
import { ListSettings, ListColumnSettingForLink, ListColumnSetting, ListColumnSettingWithFilter, ListColumnSettingForBadge } from 'src/app/Models/ListSettings';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { PartitionBaseControllerDirective } from '../PartitionBase';
import { IEssentialListItem } from 'src/app/modules/charts/essential-health-tile/essential-health-tile.component';
import { ReplicaRoles } from 'src/app/Common/Constants';

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
  quorumLossDuration = '';
  downReplicasInQuorum = 0;

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
      // Add Previous Replica Role column only when stateful partition is in quorum loss
      if (this.partition.raw.PartitionStatus === 'InQuorumLoss') {
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
      map(() => {
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

    const quorumReplicas = this.calculateWriteQuorum(this.partition.replicas.collection.map(r => r.raw));
    const isInQuorumLoss = this.partition.raw.PartitionStatus === 'InQuorumLoss';

    this.quorumLossDuration = this.formatDuration(this.partition.raw.LastQuorumLossDurationInSeconds || 0);

    this.downReplicasInQuorum = this.partition.replicas.collection.filter(r =>
      quorumReplicas.has(r.raw.ReplicaId) && r.raw.ReplicaStatus !== 'Ready'
    ).length;

    this.quorumNeeded = this.writeQuorum - (quorumReplicas.size - this.downReplicasInQuorum);

    this.listSettings.rowClass = (replica) =>
      isInQuorumLoss && quorumReplicas.has(replica.raw.ReplicaId) && replica.raw.ReplicaStatus !== 'Ready' ? 'highlighted-row' : '';
  }

  private calculateWriteQuorum(replicas: any[]): Set<string> {
    this.isInReconfiguration = !replicas.every(replica =>
      replica.PreviousReplicaRole === ReplicaRoles.None
    );

    const writeQuorumReplicaIds = new Set<string>();
    let count = 0;

    replicas.forEach(replica => {
      const countsTowardWriteQuorum = this.isInReconfiguration
        ? replica.PreviousReplicaRole === ReplicaRoles.ActiveSecondary || replica.PreviousReplicaRole === ReplicaRoles.Primary
        : replica.ReplicaRole === ReplicaRoles.ActiveSecondary || replica.ReplicaRole === ReplicaRoles.Primary;

      if (countsTowardWriteQuorum) {
        writeQuorumReplicaIds.add(replica.ReplicaId);
        count++;
      }
    });

    this.writeQuorum = Math.floor(count / 2) + 1;

    return writeQuorumReplicaIds;
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

}
