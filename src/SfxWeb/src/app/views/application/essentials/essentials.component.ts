import { Component, Injector, ChangeDetectorRef } from '@angular/core';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { DataService } from 'src/app/services/data.service';
import { ApplicationUpgradeProgress, ApplicationHealth } from 'src/app/Models/DataModels/Application';
import { ListSettings, ListColumnSettingForLink, ListColumnSetting, ListColumnSettingWithFilter, ListColumnSettingForBadge } from 'src/app/Models/ListSettings';
import { SettingsService } from 'src/app/services/settings.service';
import { forkJoin, of, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ClusterManifest } from 'src/app/Models/DataModels/Cluster';
import { ApplicationBaseControllerDirective } from '../applicationBase';
import { ListColumnSettingForApplicationServiceRow } from '../action-row/action-row.component';
import { IDashboardViewModel, DashboardViewModel } from 'src/app/ViewModels/DashboardViewModels';
import { HealthUtils, HealthStatisticsEntityKind } from 'src/app/Utils/healthUtils';
import { IEssentialListItem } from 'src/app/modules/charts/essential-health-tile/essential-health-tile.component';
@Component({
  selector: 'app-essentials',
  templateUrl: './essentials.component.html',
  styleUrls: ['./essentials.component.scss']
})
export class EssentialsComponent extends ApplicationBaseControllerDirective {

  upgradeProgress: ApplicationUpgradeProgress;
  listSettings: ListSettings;
  unhealthyEvaluationsListSettings: ListSettings;
  upgradeProgressUnhealthyEvaluationsListSettings: ListSettings;
  serviceTypesListSettings: ListSettings;

  servicesDashboard: IDashboardViewModel;
  partitionsDashboard: IDashboardViewModel;
  replicasDashboard: IDashboardViewModel;
  essentialItems: IEssentialListItem[] = [];

  constructor(protected data: DataService, injector: Injector, private settings: SettingsService) {
    super(data, injector);
  }

  setup() {
    this.listSettings = this.settings.getNewOrExistingListSettings('services', ['name'], [
      new ListColumnSettingForLink('name', 'Name', item => item.viewPath),
      new ListColumnSetting('raw.TypeName', 'Service Type'),
      new ListColumnSetting('raw.ManifestVersion', 'Version'),
      new ListColumnSettingWithFilter('raw.ServiceKind', 'Service Kind'),
      new ListColumnSettingForBadge('healthState', 'Health State'),
      new ListColumnSettingWithFilter('raw.ServiceStatus', 'Status')
    ]);

    this.serviceTypesListSettings = this.settings.getNewOrExistingListSettings('serviceTypes', ['raw.ServiceTypeDescription.ServiceTypeName'], [
        new ListColumnSetting('raw.ServiceTypeDescription.ServiceTypeName', 'Service Type Name'),
        new ListColumnSettingWithFilter('serviceKind', 'Service Kind'),
        new ListColumnSetting('raw.ServiceManifestVersion', 'Service Manifest Version'),
        new ListColumnSettingForApplicationServiceRow(),
    ]);

    this.unhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings();
    this.upgradeProgressUnhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings('upgradeProgressUnhealthyEvaluations');
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    this.data.clusterManifest.ensureInitialized().subscribe(() => {
      if (this.data.clusterManifest.isBackupRestoreEnabled) {
        this.data.refreshBackupPolicies(messageHandler);
      }
    });

    return forkJoin([
      this.app.upgradeProgress.refresh(messageHandler).pipe(map(upgradeProgress => {
        this.upgradeProgress = upgradeProgress;
      })),
      this.app.serviceTypes.refresh(messageHandler),
      this.app.services.refresh(messageHandler),
      this.app.health.refresh(messageHandler).pipe(map((appHealth: ApplicationHealth) => {
        const servicesHealthStateCount = HealthUtils.getHealthStateCount(appHealth.raw, HealthStatisticsEntityKind.Service);
        this.servicesDashboard = DashboardViewModel.fromHealthStateCount('Services', 'Service', false, servicesHealthStateCount);

        const partitionsDashboard = HealthUtils.getHealthStateCount(appHealth.raw, HealthStatisticsEntityKind.Partition);
        this.partitionsDashboard = DashboardViewModel.fromHealthStateCount('Partitions', 'Partition', false, partitionsDashboard);

        const replicasHealthStateCount = HealthUtils.getHealthStateCount(appHealth.raw, HealthStatisticsEntityKind.Replica);
        this.replicasDashboard = DashboardViewModel.fromHealthStateCount('Replicas', 'Replica', false, replicasHealthStateCount);
      }))
    ]).pipe(map(() => {
      this.essentialItems = [
        {
          descriptionName: "Application Type",
          displayText: this.app.raw.TypeName,
          copyTextValue: this.app.raw.TypeName,
          selectorName: "typename",
          displaySelector: true
        },
        {
          descriptionName: "Version",
          displayText: this.app.raw.TypeVersion,
          copyTextValue: this.app.raw.TypeVersion
        },
        {
          descriptionName: "Status",
          displayText: this.app.raw.Status,
          copyTextValue: this.app.raw.Status,
          selectorName: "status",
          displaySelector: true
        }
      ]
    }))
  }

}
