import { Component, Injector } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { ListSettings} from 'src/app/Models/ListSettings';
import { DeployedAppBaseController } from '../DeployedApplicationBase';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent extends DeployedAppBaseController {
  healthEventsListSettings: ListSettings;


  constructor(protected data: DataService, injector: Injector, private settings: SettingsService) {
    super(data, injector);
   }

  setup() {
    this.healthEventsListSettings = this.settings.getNewOrExistingHealthEventsListSettings();
  }

}
