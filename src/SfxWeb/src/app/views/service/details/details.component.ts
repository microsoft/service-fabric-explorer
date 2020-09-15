import { Component, OnInit, Injector } from '@angular/core';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable, forkJoin } from 'rxjs';
import { ListColumnSetting, ListSettings } from 'src/app/Models/ListSettings';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { ServiceBaseControllerDirective } from '../ServiceBase';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent extends ServiceBaseControllerDirective {
  healthEventsListSettings: ListSettings;

  constructor(protected data: DataService, injector: Injector, private settings: SettingsService) {
    super(data, injector);
  }

  setup() {
    this.healthEventsListSettings = this.settings.getNewOrExistingHealthEventsListSettings();
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    if (this.service.isStatefulService) {
      this.service.serviceBackupConfigurationInfoCollection.refresh(messageHandler);
    }

    return forkJoin([
      this.service.health.refresh(messageHandler),
      this.service.description.refresh(messageHandler),
      this.service.partitions.refresh(messageHandler),
      this.data.refreshBackupPolicies(messageHandler)
    ]);
  }
}
