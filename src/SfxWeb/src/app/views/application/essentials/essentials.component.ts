import { Component, Injector, ChangeDetectorRef } from '@angular/core';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { DataService } from 'src/app/services/data.service';
import { ApplicationUpgradeProgress, ApplicationHealth } from 'src/app/Models/DataModels/Application';
import { ListSettings, ListColumnSettingForLink, ListColumnSetting, ListColumnSettingWithFilter, ListColumnSettingForBadge, ListColumnSettingForArmManaged } from 'src/app/Models/ListSettings';
import { SettingsService } from 'src/app/services/settings.service';
import { forkJoin, of, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApplicationBaseControllerDirective } from '../applicationBase';
import { ListColumnSettingForApplicationServiceRow } from '../action-row/action-row.component';
import { IDashboardViewModel, DashboardViewModel } from 'src/app/ViewModels/DashboardViewModels';
import { HealthUtils, HealthStatisticsEntityKind } from 'src/app/Utils/healthUtils';
import { IEssentialListItem } from 'src/app/modules/charts/essential-health-tile/essential-health-tile.component';
import { ApplicationEvent } from 'src/app/Models/eventstore/Events';
import { ApplicationEventList } from 'src/app/Models/DataModels/collections/Collections';
import { IEventStoreData } from 'src/app/modules/event-store/event-store/event-store.component';
import { getSimultaneousEventsForEvent, IConcurrentEvents } from 'src/app/Models/eventstore/rcaEngine';
import { RelatedEventsConfigs } from 'src/app/Models/eventstore/RelatedEventsConfigs';
@Component({
  selector: 'app-essentials',
  templateUrl: './essentials.component.html',
  styleUrls: ['./essentials.component.scss']
})
export class EssentialsComponent extends ApplicationBaseControllerDirective {

  upgradeProgress: ApplicationUpgradeProgress;
  listSettings: ListSettings;
  upgradeProgressUnhealthyEvaluationsListSettings: ListSettings;
  serviceTypesListSettings: ListSettings;

  servicesDashboard: IDashboardViewModel;
  partitionsDashboard: IDashboardViewModel;
  replicasDashboard: IDashboardViewModel;
  essentialItems: IEssentialListItem[] = [];

  eventStoreHandler: IEventStoreData<ApplicationEventList, ApplicationEvent>;
  highValueEvents: IConcurrentEvents[] = null;
  failedToLoadEvents = false;

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
      new ListColumnSettingWithFilter('raw.ServiceStatus', 'Status'),
      new ListColumnSettingForArmManaged()
    ]);
    
    this.serviceTypesListSettings = this.settings.getNewOrExistingListSettings('serviceTypes', ['raw.ServiceTypeDescription.ServiceTypeName'], [
      new ListColumnSetting('raw.ServiceTypeDescription.ServiceTypeName', 'Service Type Name'),
      new ListColumnSettingWithFilter('serviceKind', 'Service Kind'),
      new ListColumnSetting('raw.ServiceManifestVersion', 'Service Manifest Version')
    ]);

    this.upgradeProgressUnhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings('upgradeProgressUnhealthyEvaluations');

    this.essentialItems = [];

    this.data.getClusterManifest().subscribe(manifest => {
      if(manifest.isEventStoreEnabled) {
        this.eventStoreHandler = this.data.getApplicationEventData(this.appId);
        this.eventStoreHandler.eventsList.setEventFilter(['ApplicationProcessExited', 'ApplicationContainerInstanceExited']);
        this.eventStoreHandler.eventsList.refresh().subscribe((success) => {
          if(success) {
            this.highValueEvents = getSimultaneousEventsForEvent(RelatedEventsConfigs, this.eventStoreHandler.getEvents(), this.eventStoreHandler.getEvents());
          }else{
            this.failedToLoadEvents = true;
          }
        })
      }
    })
  }

  afterDataSet(): void {
    if(!this.app.isArmManaged) {
      this.serviceTypesListSettings.columnSettings.push(new ListColumnSettingForApplicationServiceRow());
    }
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    this.data.clusterManifest.ensureInitialized().subscribe(() => {
      if (this.data.clusterManifest.isBackupRestoreEnabled) {
        this.data.refreshBackupPolicies(messageHandler);
      }
    });

    this.essentialItems = [
      {
        descriptionName: 'Application Type',
        displayText: this.app.raw.TypeName,
        copyTextValue: this.app.raw.TypeName,
        selectorName: 'typename',
        displaySelector: true
      },
      {
        descriptionName: 'Version',
        displayText: this.app.raw.TypeVersion,
        copyTextValue: this.app.raw.TypeVersion
      },
      {
        descriptionName: 'Status',
        displayText: this.app.raw.Status,
        copyTextValue: this.app.raw.Status,
        selectorName: 'status',
        displaySelector: true
      }
    ];

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
    ]);
  }

}
