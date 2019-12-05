import { Component, OnInit, OnDestroy, Injector } from '@angular/core';
import { switchMap, mergeMap, map } from 'rxjs/operators';
import { ActivatedRoute, ParamMap, ActivatedRouteSnapshot } from '@angular/router';
import { IdUtils } from 'src/app/Utils/IdUtils';
import { of, Subscription, Observable, forkJoin } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
import { Node } from 'src/app/Models/DataModels/Node';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { ListSettings, ListColumnSetting, ListColumnSettingForLink, ListColumnSettingForBadge, ListColumnSettingWithFilter } from 'src/app/Models/ListSettings';
import { SettingsService } from 'src/app/services/settings.service';
import { DeployedApplicationCollection } from 'src/app/Models/DataModels/collections/DeployedApplicationCollection';
import { NodeBaseController } from '../NodeBase';

@Component({
  selector: 'app-essentials',
  templateUrl: './essentials.component.html',
  styleUrls: ['./essentials.component.scss']
})
export class EssentialsComponent extends NodeBaseController {

  deployedApps: DeployedApplicationCollection;
  listSettings: ListSettings;
  unhealthyEvaluationsListSettings: ListSettings;

  constructor(protected data: DataService, injector: Injector, private settings: SettingsService) { 
    super(data, injector);
  }

  setup() {
    this.unhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings();

    this.listSettings = this.settings.getNewOrExistingListSettings("apps", ["name"], [
      new ListColumnSettingForLink("name", "Name", item => item.viewPath),
      new ListColumnSetting("raw.TypeName", "Application Type"),
      new ListColumnSettingForBadge("health.healthState", "Health State"),
      new ListColumnSettingWithFilter("raw.Status", "Status"),
    ]);
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    return forkJoin([
      this.node.health.refresh(messageHandler),
      this.node.deployedApps.refresh(messageHandler).pipe(map(deployedApps => {
        this.deployedApps = deployedApps;
      }))
    ])
  }
}
