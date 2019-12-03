import { Component, OnInit, Injector } from '@angular/core';
import { IdUtils } from 'src/app/Utils/IdUtils';
import { ActivatedRouteSnapshot } from '@angular/router';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { DataService } from 'src/app/services/data.service';
import { Application, ApplicationUpgradeProgress, DeployedApplicationHealthState } from 'src/app/Models/DataModels/Application';
import { ListSettings, ListColumnSettingForLink, ListColumnSetting, ListColumnSettingWithFilter, ListColumnSettingForBadge } from 'src/app/Models/ListSettings';
import { SettingsService } from 'src/app/services/settings.service';
import { Constants } from 'src/app/Common/Constants';
import { BaseController } from 'src/app/ViewModels/BaseController';
import { forkJoin, of, Observable } from 'rxjs';
import { mergeMap, map } from 'rxjs/operators';
import { ClusterManifest } from 'src/app/Models/DataModels/Cluster';
import { NetworkOnAppCollection } from 'src/app/Models/DataModels/Collections';

@Component({
  selector: 'app-essentials',
  templateUrl: './essentials.component.html',
  styleUrls: ['./essentials.component.scss']
})
export class EssentialsComponent extends BaseController {
  appTypeName: string;
  appId: string;

  app: Application;
  upgradeProgress: ApplicationUpgradeProgress;
  listSettings: ListSettings;
  unhealthyEvaluationsListSettings: ListSettings;
  upgradeProgressUnhealthyEvaluationsListSettings: ListSettings;
  serviceTypesListSettings: ListSettings;
  clusterManifest: ClusterManifest;
  networks: NetworkOnAppCollection;

  constructor(private data: DataService, injector: Injector, private settings: SettingsService) { 
    super(injector);
  }

  setup() {
    this.clusterManifest = new ClusterManifest(this.data);
    this.networks = new NetworkOnAppCollection(this.data, this.appId);

    this.listSettings = this.settings.getNewOrExistingListSettings("services", ["name"], [
      new ListColumnSettingForLink("name", "Name", item => item.viewPath),
      new ListColumnSetting("raw.TypeName", "Service Type"),
      new ListColumnSetting("raw.ManifestVersion", "Version"),
      new ListColumnSettingWithFilter("raw.ServiceKind", "Service Kind"),
      new ListColumnSettingForBadge("healthState", "Health State"),
      new ListColumnSettingWithFilter("raw.ServiceStatus", "Status")
  ]);

  this.serviceTypesListSettings = this.settings.getNewOrExistingListSettings("serviceTypes", ["raw.ServiceTypeDescription.ServiceTypeName"], [
      new ListColumnSetting("raw.ServiceTypeDescription.ServiceTypeName", "Service Type Name"),
      new ListColumnSettingWithFilter("serviceKind", "Service Kind"),
      new ListColumnSetting("raw.ServiceManifestVersion", "Service Manifest Version"),
      new ListColumnSetting("actions", "Actions", null, false, (item) => `<${Constants.DirectiveNameActionsRow} actions="item.actions" source="serviceTypesTable"></${Constants.DirectiveNameActionsRow}>`)
  ]);

  this.unhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings();
  this.upgradeProgressUnhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings("upgradeProgressUnhealthyEvaluations");

  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    return forkJoin([
      this.data.getApp(this.appId, true, messageHandler).pipe(mergeMap(data => {
          this.app = data;
          this.app.applicationBackupConfigurationInfoCollection.refresh(messageHandler);
          return forkJoin([
            this.app.upgradeProgress.refresh(messageHandler).pipe(map(upgradeProgress => {
                this.upgradeProgress = upgradeProgress;
            })),
            this.app.serviceTypes.refresh(messageHandler),
            this.app.services.refresh(messageHandler),
            this.clusterManifest.isNetworkInventoryManagerEnabled ? this.networks.refresh(messageHandler) : of(true)
          ])
      })),
      this.clusterManifest.ensureInitialized(false)
    ]);
  }

  getParams(route: ActivatedRouteSnapshot): void {
    this.appId = IdUtils.getAppId(route);
    this.appTypeName = IdUtils.getAppTypeName(route);
  }

}
