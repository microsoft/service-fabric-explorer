import { Component, Injector } from '@angular/core';
import { ListSettings, ListColumnSettingForLink, ListColumnSetting, ListColumnSettingWithFilter, ListColumnSettingForBadge } from 'src/app/Models/ListSettings';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable, forkJoin, of } from 'rxjs';
import { PartitionBaseControllerDirective } from '../PartitionBase';
import { IEssentialListItem } from 'src/app/modules/charts/essential-health-tile/essential-health-tile.component';

@Component({
  selector: 'app-essentials',
  templateUrl: './essentials.component.html',
  styleUrls: ['./essentials.component.scss']
})
export class EssentialsComponent extends PartitionBaseControllerDirective {

  public hideReplicator = true;
  listSettings: ListSettings;

  essentialItems: IEssentialListItem[] = [];

  constructor(protected data: DataService, injector: Injector, private settings: SettingsService) {
    super(data, injector);
  }

  setup() {
    this.setEssentialData();
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    this.setEssentialData();

    if (!this.listSettings) {
        let defaultSortProperties = ['replicaRoleSortPriority', 'raw.NodeName'];
        const columnSettings = [
            new ListColumnSettingForLink('id', 'Id', item => item.viewPath),
            new ListColumnSetting('raw.NodeName', 'Node Name'),
            new ListColumnSettingWithFilter('role', 'Instance Role', {sortPropertyPaths: defaultSortProperties}),
            new ListColumnSettingForBadge('healthState', 'Health State'),
            new ListColumnSettingWithFilter('raw.ReplicaStatus', 'Status')
        ];

        if (this.partition.isStatelessService && !this.partition.isSelfReconfiguringService) {
            columnSettings.splice(2, 1); // Remove replica role column
            defaultSortProperties = ['raw.NodeName'];
        }

        // Keep the sort properties in sync with the sortBy for ClusterTreeService.getDeployedReplicas
        this.listSettings = this.settings.getNewOrExistingListSettings('replicas', defaultSortProperties, columnSettings);
    }

    return forkJoin([
      this.partition.health.refresh(messageHandler),
      this.partition.replicas.refresh(messageHandler)
    ]);
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
