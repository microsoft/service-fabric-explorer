import { Component, Injector } from '@angular/core';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { DeployedApplicationHealthState } from 'src/app/Models/DataModels/Application';
import { ListSettings, ListColumnSettingForBadge, ListColumnSettingForLink } from 'src/app/Models/ListSettings';
import { map } from 'rxjs/operators';
import { ApplicationBaseController } from '../applicationBase';

@Component({
  selector: 'app-deployments',
  templateUrl: './deployments.component.html',
  styleUrls: ['./deployments.component.scss']
})
export class DeploymentsComponent extends ApplicationBaseController {

  deployedApplicationsHealthStatesListSettings: ListSettings;
  deployedApplicationsHealthStates: DeployedApplicationHealthState[] = [];

  constructor(protected data: DataService, injector: Injector, private settings: SettingsService) {
    super(data, injector);
  }

  setup() {
    this.deployedApplicationsHealthStatesListSettings = this.settings.getNewOrExistingListSettings('deployedApps', ['raw.NodeName'], [
        new ListColumnSettingForLink('raw.NodeName', 'Node Name', item => item.viewPath),
        new ListColumnSettingForBadge('healthState', 'Health State'),
    ]);
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    return this.app.health.refresh(messageHandler).pipe(map(() => {
      this.deployedApplicationsHealthStates = this.app.health.deployedApplicationHealthStates;
    }));
  }
}
