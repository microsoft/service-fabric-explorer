import { Component, OnInit, Injector } from '@angular/core';
import { ReplicaBaseController } from '../ReplicaBase';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
import { ListSettings } from 'src/app/Models/ListSettings';
import { SettingsService } from 'src/app/services/settings.service';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent extends ReplicaBaseController {

  healthEventsListSettings: ListSettings;

  constructor(protected data: DataService, injector: Injector, private settings: SettingsService) {
    super(data, injector);
  }

  setup() {
    this.healthEventsListSettings = this.settings.getNewOrExistingHealthEventsListSettings();
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    return this.replica.detail.refresh(messageHandler);
  }
}
