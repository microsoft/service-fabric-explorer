import { Component, Injector } from '@angular/core';
import { ListSettings, ListColumnSettingForLink, ListColumnSetting, ListColumnSettingWithFilter, ListColumnSettingWithCustomComponent } from 'src/app/Models/ListSettings';
import { ApplicationUpgradeProgress } from 'src/app/Models/DataModels/Application';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { map } from 'rxjs/operators';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable, forkJoin, of } from 'rxjs';
import { ViewUpgradesListItemComponent } from '../view-upgrades-list-item/view-upgrades-list-item.component';
import { ApplicationsBaseControllerDirective } from '../applicationsBase';

@Component({
  selector: 'app-upgrading',
  templateUrl: './upgrading.component.html',
  styleUrls: ['./upgrading.component.scss']
})
export class UpgradingComponent extends ApplicationsBaseControllerDirective {

  upgradeAppsListSettings: ListSettings;
  upgradeProgresses: ApplicationUpgradeProgress[] = [];

  constructor(data: DataService, private settings: SettingsService, injector: Injector) {
    super(data, injector);
   }

  setup() {
    this.upgradeAppsListSettings = this.settings.getNewOrExistingListSettings('upgrades', ['name'], [
      new ListColumnSettingForLink('name', 'Name', item => item.viewPath),
      new ListColumnSettingForLink('parent.raw.TypeName', 'Application Type', item => item.parent.appTypeViewPath),
      new ListColumnSetting('parent.raw.TypeVersion', 'Current Version'),
      new ListColumnSetting('raw.TargetApplicationTypeVersion', 'Target Version'),
      new ListColumnSettingWithCustomComponent(ViewUpgradesListItemComponent, 'upgrade', 'Progress by Upgrade Domain', {
        enableFilter: false
      }),
      new ListColumnSettingWithFilter('raw.UpgradeState', 'Upgrade State')
    ]);
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    const observables = this.apps.collection.filter(app => app.isUpgrading).map(app => app.upgradeProgress.refresh(messageHandler));

    if (observables.length === 0) {
      return of(null);
    }
    return forkJoin(observables).pipe(map(() => {
        this.upgradeProgresses = this.apps.collection.filter(app => app.isUpgrading).map(app => app.upgradeProgress);
    }));
  }

}
