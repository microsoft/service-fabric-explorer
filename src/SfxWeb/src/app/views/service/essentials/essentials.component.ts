import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { ListSettings, ListColumnSettingForLink, ListColumnSettingWithFilter, ListColumnSettingForBadge } from 'src/app/Models/ListSettings';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable, forkJoin, of } from 'rxjs';
import { ServiceBaseControllerDirective } from '../ServiceBase';
import { map } from 'rxjs/operators';
import { HealthUtils, HealthStatisticsEntityKind } from 'src/app/Utils/healthUtils';
import { IDashboardViewModel, DashboardViewModel } from 'src/app/ViewModels/DashboardViewModels';
import { ServiceHealth } from 'src/app/Models/DataModels/Service';
import { IEssentialListItem } from 'src/app/modules/charts/essential-health-tile/essential-health-tile.component';
import { ExperienceService } from 'src/app/services/experience.service';

@Component({
    selector: 'app-essentials',
    templateUrl: './essentials.component.html',
    styleUrls: ['./essentials.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class EssentialsComponent extends ServiceBaseControllerDirective {
  public experience = inject(ExperienceService);
  protected data: DataService = inject(DataService);
  private settings = inject(SettingsService);


  listSettings!: ListSettings;
  partitionsDashboard!: IDashboardViewModel;
  replicasDashboard!: IDashboardViewModel;

  essentialItems: IEssentialListItem[] = [];
  overviewItems: IEssentialListItem[] = [];

  setup() {
    this.listSettings = this.settings.getNewOrExistingListSettings('partitions', ['id'], [
      new ListColumnSettingForLink('id', 'Id', item => item.viewPath),
      new ListColumnSettingWithFilter('partitionInformation.raw.ServicePartitionKind', 'Partition Kind'),
      new ListColumnSettingForBadge('healthState', 'Health State'),
      new ListColumnSettingWithFilter('raw.PartitionStatus', 'Status'),
    ]);

    this.essentialItems = [];
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    this.essentialItems = [
      {
        descriptionName: 'Service Type Version',
        displayText: this.service.raw.ManifestVersion,
        copyTextValue: this.service.raw.ManifestVersion,
      },
      {
        descriptionName: 'Service Type',
        displayText: this.service.raw.TypeName,
        copyTextValue: this.service.raw.TypeName
      },
      {
        descriptionName: 'Status',
        displayText: this.service.raw.ServiceStatus,
        copyTextValue: this.service.raw.ServiceStatus,
        selectorName: 'status',
        displaySelector: true
      }
    ];

    this.setOverviewItems();

    return forkJoin([
      this.service.description.refresh(messageHandler).pipe(map(() => this.setOverviewItems())),
      this.service.health.refresh(messageHandler).pipe(map((replicaHealth: ServiceHealth) => {
        const partitionsDashboard = HealthUtils.getHealthStateCount(replicaHealth.raw, HealthStatisticsEntityKind.Partition);
        this.partitionsDashboard = DashboardViewModel.fromHealthStateCount('Partitions', 'Partition', false, partitionsDashboard);

        const replicasHealthStateCount = HealthUtils.getHealthStateCount(replicaHealth.raw, HealthStatisticsEntityKind.Replica);
        this.replicasDashboard = DashboardViewModel.fromHealthStateCount('Replicas', 'Replica', false, replicasHealthStateCount);
      })),
      this.service.partitions.refresh(messageHandler)
    ]);
  }

  private setOverviewItems() {
    const description = this.service.description.raw;
    this.overviewItems = [...this.essentialItems];
    if (!description) { return; }
    this.overviewItems.push({ descriptionName: 'Service Kind', displayText: description.ServiceKind });
    const counts = this.service.isStatefulService
      ? [['Minimum Replica Set Size', description.MinReplicaSetSize], ['Target Replica Set Size', description.TargetReplicaSetSize]] as const
      : [['Instance Count', description.InstanceCount], ['Minimum Instance Count', description.MinInstanceCount]] as const;
    for (const [descriptionName, value] of counts) {
      this.overviewItems.push({ descriptionName, displayText: value == null ? 'Not available' : String(value) });
    }
    if (this.service.description.isInitialized) {
      this.overviewItems.push({
        descriptionName: 'Placement Constraints',
        valueUrl: 'https://learn.microsoft.com/en-us/azure/service-fabric/service-fabric-cluster-resource-manager-configure-services#placement-constraints',
        displayText: description.PlacementConstraints || 'No placement constraints defined'
      });
    }
  }

}
