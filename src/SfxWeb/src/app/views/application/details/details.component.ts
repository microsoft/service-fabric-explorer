import { Component, OnInit, Injector } from '@angular/core';
import { BaseController } from 'src/app/ViewModels/BaseController';
import { Application } from 'src/app/Models/DataModels/Application';
import { ListSettings, ListColumnSetting } from 'src/app/Models/ListSettings';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { ActivatedRouteSnapshot } from '@angular/router';
import { IdUtils } from 'src/app/Utils/IdUtils';
import { mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent extends BaseController {
  appTypeName: string;
  appId: string;

  app: Application;
  healthEventsListSettings: ListSettings;
  applicationBackupConfigurationInfoListSettings: ListSettings;

  constructor(private data: DataService, injector: Injector, private settings: SettingsService) { 
    super(injector);
  }

  setup() {
    this.applicationBackupConfigurationInfoListSettings = this.settings.getNewOrExistingListSettings("backupConfigurationInfoCollection", ["raw.PolicyName"], [
      new ListColumnSetting("raw.PolicyName", "Policy Name", ["raw.PolicyName"], false, (item, property) => "<a href='" + item.parent.viewPath + "/tab/details'>" + property + "</a>", 1, item => item.action.runWithCallbacks.apply(item.action)),
      new ListColumnSetting("raw.Kind", "Kind"),
      new ListColumnSetting("raw.PolicyInheritedFrom", "Policy Inherited From"),
      new ListColumnSetting("raw.ServiceName", "Service Name"),
      new ListColumnSetting("raw.PartitionId", "Partition Id"),
      new ListColumnSetting("raw.SuspensionInfo.IsSuspended", "Is Suspended"),
      new ListColumnSetting("raw.SuspensionInfo.SuspensionInheritedFrom", "Suspension Inherited From"),
    ]);
    this.healthEventsListSettings = this.settings.getNewOrExistingHealthEventsListSettings();
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    return this.data.getApp(this.appId, true, messageHandler).pipe(mergeMap(data => {
          this.app = data;
          this.app.applicationBackupConfigurationInfoCollection.refresh(messageHandler);
          return this.app.health.refresh(messageHandler);
      }));
  }

  getParams(route: ActivatedRouteSnapshot): void {
    this.appId = IdUtils.getAppId(route);
    this.appTypeName = IdUtils.getAppTypeName(route);
  }

}
