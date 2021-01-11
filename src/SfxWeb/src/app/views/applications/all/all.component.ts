import { Component, OnInit, Injector } from '@angular/core';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { ApplicationCollection } from 'src/app/Models/DataModels/collections/Collections';
import { ListSettings, ListColumnSettingForLink, ListColumnSettingWithFilter, ListColumnSettingForBadge, ListColumnSetting } from 'src/app/Models/ListSettings';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-all',
  templateUrl: './all.component.html',
  styleUrls: ['./all.component.scss']
})
export class AllComponent extends BaseControllerDirective {

  apps: ApplicationCollection;
  listSettings: ListSettings;

  constructor(private data: DataService, private settings: SettingsService, injector: Injector) {
    super(injector);
   }

  setup() {
    this.listSettings = this.settings.getNewOrExistingListSettings('apps', ['name'], [
      new ListColumnSettingForLink('name', 'Name', item => item.viewPath),
      new ListColumnSettingWithFilter('raw.TypeName', 'Application Type'),
      new ListColumnSetting('raw.TypeVersion', 'Version'),
      new ListColumnSettingForBadge('healthState', 'Health State'),
      new ListColumnSettingWithFilter('raw.Status', 'Status')
    ]);
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return this.data.getApps(true, messageHandler).pipe(map(apps => {
      this.apps = apps;
    }));
  }

}
