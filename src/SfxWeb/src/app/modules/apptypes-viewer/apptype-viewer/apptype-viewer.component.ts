import { Component, Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { IAppTypeUsage } from 'src/app/Models/DataModels/collections/Collections';
import { ListSettings } from 'src/app/Models/ListSettings';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';

@Component({
  selector: 'app-apptype-viewer',
  templateUrl: './apptype-viewer.component.html',
  styleUrls: ['./apptype-viewer.component.scss']
})
export class ApptypeViewerComponent extends BaseControllerDirective {

  usage: IAppTypeUsage;
  activeAppTypesListSettings: ListSettings;
  appTypesListSettings: ListSettings;

  constructor(public dataService: DataService, private settings: SettingsService, injector: Injector) {
    super(injector);
  }

  setup(): void {
    this.activeAppTypesListSettings = this.settings.getNewOrExistingAppTypeListSettings(false, false);
    this.appTypesListSettings = this.settings.getNewOrExistingAppTypeListSettings(false, false);
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return this.dataService.appTypeGroups.ensureInitialized(true, messageHandler).pipe(mergeMap(() => {
      return this.dataService.appTypeGroups.getAppTypeUsage().pipe(map(data => {
        this.usage = data;
      }))
    }))
  }
}
