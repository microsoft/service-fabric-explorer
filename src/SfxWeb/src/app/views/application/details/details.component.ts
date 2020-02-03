import { Component, OnInit, Injector } from '@angular/core';
import { ListSettings, ListColumnSetting } from 'src/app/Models/ListSettings';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { ApplicationBaseController } from '../applicationBase';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent extends ApplicationBaseController {

  healthEventsListSettings: ListSettings;
  applicationBackupConfigurationInfoListSettings: ListSettings;

  constructor(protected data: DataService, injector: Injector, private settings: SettingsService) { 
    super(data, injector);
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
    this.subscriptions.add(this.data.clusterManifest.ensureInitialized().subscribe( () => {
      if(this.data.clusterManifest.isBackupRestoreEnabled){
        this.app.applicationBackupConfigurationInfoCollection.refresh(messageHandler);
      }
    }))
    return this.app.health.refresh(messageHandler);
  }

}
