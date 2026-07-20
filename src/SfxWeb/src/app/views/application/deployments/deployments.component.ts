import { Component, inject } from '@angular/core';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { DeployedApplicationHealthState } from 'src/app/Models/DataModels/Application';
import { ListSettings, ListColumnSettingForBadge, ListColumnSettingForLink } from 'src/app/Models/ListSettings';
import { map } from 'rxjs/operators';
import { ApplicationBaseControllerDirective } from '../applicationBase';

@Component({
    selector: 'app-deployments',
    templateUrl: './deployments.component.html',
    styleUrls: ['./deployments.component.scss'],
    standalone: false
})
export class DeploymentsComponent extends ApplicationBaseControllerDirective {
  protected data: DataService = inject(DataService);
  private settings = inject(SettingsService);


  deployedApplicationsHealthStatesListSettings: ListSettings;
  deployedApplicationsHealthStates: DeployedApplicationHealthState[] = [];

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
