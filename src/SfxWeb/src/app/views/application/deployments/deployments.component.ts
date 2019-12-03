import { Component, OnInit, Injector } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { IdUtils } from 'src/app/Utils/IdUtils';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { BaseController } from 'src/app/ViewModels/BaseController';
import { Application, DeployedApplicationHealthState } from 'src/app/Models/DataModels/Application';
import { ListSettings, ListColumnSettingForBadge, ListColumnSettingForLink } from 'src/app/Models/ListSettings';
import { mergeMap, map } from 'rxjs/operators';

@Component({
  selector: 'app-deployments',
  templateUrl: './deployments.component.html',
  styleUrls: ['./deployments.component.scss']
})
export class DeploymentsComponent extends BaseController {
  appTypeName: string;
  appId: string;

  app: Application;
  deployedApplicationsHealthStatesListSettings: ListSettings;
  deployedApplicationsHealthStates: DeployedApplicationHealthState[] = [];

  constructor(private data: DataService, injector: Injector, private settings: SettingsService) { 
    super(injector);
  }

  setup() {
  this.deployedApplicationsHealthStatesListSettings = this.settings.getNewOrExistingListSettings("deployedApps", ["raw.NodeName"], [
      new ListColumnSettingForLink("raw.NodeName", "Node Name", item => item.viewPath),
      new ListColumnSettingForBadge("healthState", "Health State"),
  ]);

  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    return this.data.getApp(this.appId, true, messageHandler).pipe(mergeMap(data => {
        this.app = data;
        return this.app.health.refresh(messageHandler).pipe(map(() => {
          this.deployedApplicationsHealthStates = this.app.health.deployedApplicationHealthStates;
        }));
    }));
  }

  getParams(route: ActivatedRouteSnapshot): void {
    this.appId = IdUtils.getAppId(route);
    this.appTypeName = IdUtils.getAppTypeName(route);
  }

}
