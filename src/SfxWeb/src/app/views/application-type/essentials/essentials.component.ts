import { Component, Injector } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { Observable } from 'rxjs';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { ApplicationTypeGroup } from 'src/app/Models/DataModels/ApplicationType';
import { ListSettings, ListColumnSetting, ListColumnSettingWithFilter, ListColumnSettingForBadge, ListColumnSettingForLink } from 'src/app/Models/ListSettings';
import { HtmlUtils } from 'src/app/Utils/HtmlUtils';
import { ApplicationTypeBaseControllerDirective } from '../ApplicationTypeBase';
import { ListColumnSettingForApplicationType } from '../action-row/action-row.component';

@Component({
  selector: 'app-essentials',
  templateUrl: './essentials.component.html',
  styleUrls: ['./essentials.component.scss']
})
export class EssentialsComponent extends ApplicationTypeBaseControllerDirective {
  appTypeGroup: ApplicationTypeGroup;
  appsListSettings: ListSettings;
  appTypesListSettings: ListSettings;

  constructor(protected data: DataService, injector: Injector, private settings: SettingsService) {
    super(data, injector);
  }

  setup() {
    this.appTypesListSettings = this.settings.getNewOrExistingListSettings(
      'appTypeAppTypes',
      ['raw.Version'],
      [
          new ListColumnSetting('name', 'Name'),
          new ListColumnSetting('raw.Version', 'Version'),
          new ListColumnSettingWithFilter('raw.Status', 'Status'),
          new ListColumnSettingForApplicationType()
      ],
      [
          new ListColumnSetting('placeholder', 'placeholder', null, {enableFilter: false}), // Empty column
          new ListColumnSetting('raw.StatusDetails', 'Status Details', null, {
            enableFilter: false,
            getDisplayHtml: (item) => HtmlUtils.getSpanWithCustomClass('preserve-whitespace-wrap', item.raw.StatusDetails),
            colspan: 100
          })
      ],
      false /* collapsable */,
      (item) => item.raw.StatusDetails, /* only show second row when status details is not empty */
      false /* searchable */);

    this.appsListSettings = this.settings.getNewOrExistingListSettings('appTypeApps', ['name'], [
        new ListColumnSettingForLink('name', 'Name', item => item.viewPath),
        new ListColumnSetting('raw.TypeName', 'Application Type'),
        new ListColumnSetting('raw.TypeVersion', 'Version'),
        new ListColumnSettingForBadge('healthState', 'Health State'),
        new ListColumnSettingWithFilter('raw.Status', 'Status'),
    ]);
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    return this.data.getApps(true, messageHandler);
  }

}
