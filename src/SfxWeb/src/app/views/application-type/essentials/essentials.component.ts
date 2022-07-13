import { Component, Injector } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { Observable } from 'rxjs';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { ApplicationType, ApplicationTypeGroup } from 'src/app/Models/DataModels/ApplicationType';
import { ListSettings, ListColumnSetting, ListColumnSettingWithFilter, ListColumnSettingForBadge, ListColumnSettingForLink } from 'src/app/Models/ListSettings';
import { ApplicationTypeBaseControllerDirective } from '../ApplicationTypeBase';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-essentials',
  templateUrl: './essentials.component.html',
  styleUrls: ['./essentials.component.scss']
})
export class EssentialsComponent extends ApplicationTypeBaseControllerDirective {
  appTypeGroup: ApplicationTypeGroup;
  appsListSettings: ListSettings;
  appTypesListSettings: ListSettings;
  activeAppTypesListSettings: ListSettings;

  // have a separate list for active app types in addition to the app types on the appTypeGroup
  activeAppTypes: ApplicationType[] = [];

  constructor(protected data: DataService, injector: Injector, private settings: SettingsService) {
    super(data, injector);
  }

  setup() {
    this.activeAppTypesListSettings = this.settings.getNewOrExistingAppTypeListSettings();
    this.appTypesListSettings = this.settings.getNewOrExistingAppTypeListSettings(true);

    this.appsListSettings = this.settings.getNewOrExistingListSettings('appTypeApps', ['name'], [
      new ListColumnSettingForLink('name', 'Name', item => item.viewPath),
      new ListColumnSetting('raw.TypeName', 'Application Type'),
      new ListColumnSetting('raw.TypeVersion', 'Version'),
      new ListColumnSettingForBadge('healthState', 'Health State'),
      new ListColumnSettingWithFilter('raw.Status', 'Status'),
    ]);

  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return this.data.getApps(true, messageHandler).pipe(map(() => {
      this.activeAppTypes = this.appTypeGroup.activeAppTypes;
    }))
  }
}
