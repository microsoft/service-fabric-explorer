import { Component, OnInit, Injector } from '@angular/core';
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

@Component({
  selector: 'app-essentials',
  templateUrl: './essentials.component.html',
  styleUrls: ['./essentials.component.scss']
})
export class EssentialsComponent extends ServiceBaseControllerDirective {

  listSettings: ListSettings;
  partitionsDashboard: IDashboardViewModel;
  replicasDashboard: IDashboardViewModel;

  essentialItems: IEssentialListItem[] = [];

  constructor(protected data: DataService, injector: Injector, private settings: SettingsService) {
    super(data, injector);
  }

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

    this.service.description.refresh(messageHandler).subscribe();

    return forkJoin([
      this.service.health.refresh(messageHandler).pipe(map((replicaHealth: ServiceHealth) => {
        const partitionsDashboard = HealthUtils.getHealthStateCount(replicaHealth.raw, HealthStatisticsEntityKind.Partition);
        this.partitionsDashboard = DashboardViewModel.fromHealthStateCount('Partitions', 'Partition', false, partitionsDashboard);

        const replicasHealthStateCount = HealthUtils.getHealthStateCount(replicaHealth.raw, HealthStatisticsEntityKind.Replica);
        this.replicasDashboard = DashboardViewModel.fromHealthStateCount('Replicas', 'Replica', false, replicasHealthStateCount);
      })),
      this.service.partitions.refresh(messageHandler)
    ]);
  }

}
