import { Component, Injector } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { ListSettings, ListColumnSettingForLink, ListColumnSettingForBadge, ListColumnSettingWithFilter, ListColumnSetting } from 'src/app/Models/ListSettings';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { DeployedAppBaseControllerDirective } from '../DeployedApplicationBase';
import { IEssentialListItem } from 'src/app/modules/charts/essential-health-tile/essential-health-tile.component';

@Component({
  selector: 'app-essentials',
  templateUrl: './essentials.component.html',
  styleUrls: ['./essentials.component.scss']
})
export class EssentialsComponent extends DeployedAppBaseControllerDirective {
  listSettings: ListSettings;

  essentialItems: IEssentialListItem[] = [];

  constructor(protected data: DataService, injector: Injector, private settings: SettingsService) {
      super(data, injector);
   }


   refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    this.essentialItems = [
      {
        descriptionName: 'Application Type',
        copyTextValue: this.deployedApp.raw.TypeName,
        selectorName: 'appTypeViewPath',
        displaySelector: true
      },
      {
        descriptionName: 'Disk Location',
        displayText: this.deployedApp.diskLocation,
        copyTextValue: this.deployedApp.diskLocation
      },
      {
        descriptionName: 'Status',
        copyTextValue: this.deployedApp.raw.Status,
        selectorName: 'status',
        displaySelector: true
      }
    ];
    return this.deployedApp.deployedServicePackages.refresh(messageHandler);
  }


  setup(){
    this.essentialItems = [];
    this.listSettings = this.settings.getNewOrExistingListSettings('servicePackages', ['name'], [
      new ListColumnSettingForLink('uniqueId', 'Name', item => item.viewPath),
      new ListColumnSetting('raw.Version', 'Version'),
      new ListColumnSettingForBadge('health.healthState', 'Health State'),
      new ListColumnSettingWithFilter('raw.Status', 'Status')
    ]);
  }
}
