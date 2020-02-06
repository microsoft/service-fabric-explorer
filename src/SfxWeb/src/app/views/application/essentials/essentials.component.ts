import { Component, Injector, ChangeDetectorRef } from '@angular/core';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { DataService } from 'src/app/services/data.service';
import { ApplicationUpgradeProgress } from 'src/app/Models/DataModels/Application';
import { ListSettings, ListColumnSettingForLink, ListColumnSetting, ListColumnSettingWithFilter, ListColumnSettingForBadge } from 'src/app/Models/ListSettings';
import { SettingsService } from 'src/app/services/settings.service';
import { Constants } from 'src/app/Common/Constants';
import { forkJoin, of, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ClusterManifest } from 'src/app/Models/DataModels/Cluster';
import { ApplicationBaseController } from '../applicationBase';
import { ListColumnSettingForApplicationServiceRow } from '../action-row/action-row.component';
@Component({
  selector: 'app-essentials',
  templateUrl: './essentials.component.html',
  styleUrls: ['./essentials.component.scss']
})
export class EssentialsComponent extends ApplicationBaseController {

  upgradeProgress: ApplicationUpgradeProgress;
  listSettings: ListSettings;
  unhealthyEvaluationsListSettings: ListSettings;
  upgradeProgressUnhealthyEvaluationsListSettings: ListSettings;
  serviceTypesListSettings: ListSettings;
  clusterManifest: ClusterManifest;

  constructor(protected data: DataService, injector: Injector, private settings: SettingsService, private cdr: ChangeDetectorRef) { 
    super(data, injector);
  }

  setup() {
    this.clusterManifest = new ClusterManifest(this.data);

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
        new ListColumnSettingForApplicationServiceRow(),
    ]);

    this.unhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings();
    this.upgradeProgressUnhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings("upgradeProgressUnhealthyEvaluations");
      this.cdr.detectChanges();

  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    this.data.refreshBackupPolicies(messageHandler);

    console.log(this.app)
    return forkJoin([
      this.clusterManifest.ensureInitialized(false),
      this.app.upgradeProgress.refresh(messageHandler).pipe(map(upgradeProgress => {
        this.upgradeProgress = upgradeProgress;
      })),
      this.app.serviceTypes.refresh(messageHandler),
      this.app.services.refresh(messageHandler),
      this.app.health.refresh(messageHandler)
    ]).pipe(map( () => {
      this.cdr.detectChanges();
    }))
  }

}
