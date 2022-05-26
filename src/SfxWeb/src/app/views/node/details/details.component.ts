import { Component, Injector } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { Observable, forkJoin } from 'rxjs';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { SettingsService } from 'src/app/services/settings.service';
import { NodeBaseControllerDirective } from '../NodeBase';
import { ListColumnSetting, ListColumnSettingForBadge, ListColumnSettingForLink, ListColumnSettingWithFilter, ListSettings } from 'src/app/Models/ListSettings';
import { DeployedApplicationCollection } from 'src/app/Models/DataModels/collections/DeployedApplicationCollection';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent extends NodeBaseControllerDirective {

  listSettings: ListSettings;
  deployedApps: DeployedApplicationCollection;

  constructor(protected data: DataService, injector: Injector, private settings: SettingsService) {
    super(data, injector);
  }

  setup() {
    this.listSettings = this.settings.getNewOrExistingListSettings('apps', ['name'], [
      new ListColumnSettingForLink('name', 'Name', item => item.viewPath),
      new ListColumnSetting('raw.TypeName', 'Application Type'),
      new ListColumnSettingForBadge('health.healthState', 'Health State'),
      new ListColumnSettingWithFilter('raw.Status', 'Status'),
    ]);
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    return forkJoin([
      this.node.loadInformation.refresh(messageHandler),
      this.node.deployedApps.refresh(messageHandler).pipe(map(() => {
        this.deployedApps = this.node.deployedApps;
      })),
    ]);
  }
}
