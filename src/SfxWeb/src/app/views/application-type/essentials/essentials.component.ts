import { Component, Injector } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { Observable } from 'rxjs';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { ApplicationType, ApplicationTypeGroup } from 'src/app/Models/DataModels/ApplicationType';
import { ListSettings, ListColumnSetting, ListColumnSettingWithFilter, ListColumnSettingForBadge, ListColumnSettingForLink } from 'src/app/Models/ListSettings';
import { HtmlUtils } from 'src/app/Utils/HtmlUtils';
import { ApplicationTypeBaseControllerDirective } from '../ApplicationTypeBase';
import { ListColumnSettingForApplicationType } from '../action-row/action-row.component';
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

  //have a separate list for active app types in addition to the app types on the appTypeGroup
  activeAppTypes: ApplicationType[] = [];

  constructor(protected data: DataService, injector: Injector, private settings: SettingsService) {
    super(data, injector);
  }

  setup() {
    this.activeAppTypesListSettings = this.getNewOrExistingAppTypeListSettings();
    this.appTypesListSettings = this.getNewOrExistingAppTypeListSettings(true);

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
      try {
        //check on refresh which appTypes are being used by at least one application
        this.activeAppTypes = [];
        this.appTypeGroup.appTypes.forEach(appType => {
          const used = this.appTypeGroup.apps.some(app => app.raw.TypeVersion === appType.raw.Version);
          appType.isInUse = used;
          if (used) {
            this.activeAppTypes.push(appType);
          }
        });
      } catch (e) {
        console.log(e);
      }
    })
    );
  }

  public getNewOrExistingAppTypeListSettings(includeIsUsedColumn: boolean = false) {
    let listKey = 'appTypeAppTypes';
    const settings = [
      new ListColumnSetting('name', 'Name'),
      new ListColumnSetting('raw.Version', 'Version'),
      new ListColumnSettingWithFilter('raw.Status', 'Status'),
      new ListColumnSettingForApplicationType()
    ];

    const nestedList = [
      new ListColumnSetting('placeholder', 'placeholder', { enableFilter: false }), // Empty column
      new ListColumnSetting('raw.StatusDetails', 'Status Details', {
        enableFilter: false,
        getDisplayHtml: (item) => HtmlUtils.getSpanWithCustomClass('preserve-whitespace-wrap', item.raw.StatusDetails),
        colspan: 100
      })
    ];

    if (includeIsUsedColumn) {
      settings.splice(3, 0, new ListColumnSetting('isInUse', 'In Use'));
      listKey += 'andUsedCol';
    }

    return this.settings.getNewOrExistingListSettings(listKey, ['raw.Version'], settings, nestedList,
      false,
      (item) => item.raw.StatusDetails,
      false);
  }

}
