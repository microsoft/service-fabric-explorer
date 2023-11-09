import { Component, Injector } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { ListSettings, ListColumnSettingForLink, ListColumnSettingWithFilter, ListColumnSettingForBadge, ListColumnSetting, ListColumnSettingForArmManaged } from 'src/app/Models/ListSettings';
import { ApplicationsBaseControllerDirective } from '../applicationsBase';

@Component({
  selector: 'app-all',
  templateUrl: './all.component.html',
  styleUrls: ['./all.component.scss']
})
export class AllComponent extends ApplicationsBaseControllerDirective {

  listSettings: ListSettings;

  constructor(public data: DataService, private settings: SettingsService, injector: Injector) {
    super(data, injector);
   }

  setup() {
    this.listSettings = this.settings.getNewOrExistingListSettings('apps', ['name'], [
      new ListColumnSettingForLink('name', 'Name', item => item.viewPath),
      new ListColumnSettingWithFilter('raw.TypeName', 'Application Type'),
      new ListColumnSetting('raw.TypeVersion', 'Version'),
      new ListColumnSettingForBadge('healthState', 'Health State'),
      new ListColumnSettingWithFilter('raw.Status', 'Status'),
      new ListColumnSettingForArmManaged()
    ]);
  }

}
