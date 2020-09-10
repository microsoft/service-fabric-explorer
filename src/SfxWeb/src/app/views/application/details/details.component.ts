import { Component, OnInit, Injector } from '@angular/core';
import { ListSettings, ListColumnSetting } from 'src/app/Models/ListSettings';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { ApplicationBaseController } from '../applicationBase';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent extends ApplicationBaseController {

  healthEventsListSettings: ListSettings;

  constructor(protected data: DataService, injector: Injector, private settings: SettingsService) {
    super(data, injector);
  }

  setup() {
    this.healthEventsListSettings = this.settings.getNewOrExistingHealthEventsListSettings();
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    return this.app.health.refresh(messageHandler);
  }
}
