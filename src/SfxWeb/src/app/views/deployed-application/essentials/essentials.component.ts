import { Component, OnInit, OnDestroy, Injector } from '@angular/core';
import { Subscription, of, Observable, forkJoin } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
import { ActivatedRoute, ParamMap, ActivatedRouteSnapshot } from '@angular/router';
import { SettingsService } from 'src/app/services/settings.service';
import { map } from 'rxjs/operators';
import { ListSettings, ListColumnSettingForLink, ListColumnSettingForBadge, ListColumnSettingWithFilter, ListColumnSetting } from 'src/app/Models/ListSettings';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { DeployedServicePackageCollection } from 'src/app/Models/DataModels/collections/Collections';
import { DeployedAppBaseController } from '../DeployedApplicationBase';

@Component({
  selector: 'app-essentials',
  templateUrl: './essentials.component.html',
  styleUrls: ['./essentials.component.scss']
})
export class EssentialsComponent extends DeployedAppBaseController {
  deployedServicePackages: DeployedServicePackageCollection;

  unhealthyEvaluationsListSettings: ListSettings;
  listSettings: ListSettings;

  constructor(protected data: DataService, injector: Injector, private settings: SettingsService) {
      super(data, injector);
   }


  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    return forkJoin([
      this.deployedApp.deployedServicePackages.refresh(messageHandler).pipe(map(servicePackages => {
        this.deployedServicePackages = servicePackages;
      })),
      this.deployedApp.health.refresh(messageHandler)
    ]);
  }


  setup(){
    this.unhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings();
    this.listSettings = this.settings.getNewOrExistingListSettings('servicePackages', ['name'], [
      new ListColumnSettingForLink('uniqueId', 'Name', item => item.viewPath),
      new ListColumnSetting('raw.Version', 'Version'),
      new ListColumnSettingForBadge('health.healthState', 'Health State'),
      new ListColumnSettingWithFilter('raw.Status', 'Status')
    ]);
  }
}
