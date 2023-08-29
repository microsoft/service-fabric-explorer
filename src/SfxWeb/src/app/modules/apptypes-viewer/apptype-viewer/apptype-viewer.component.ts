import { Component, Injector, Input, OnChanges } from '@angular/core';
import { ApplicationType } from 'src/app/Models/DataModels/ApplicationType';
import { ListSettings } from 'src/app/Models/ListSettings';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';

@Component({
  selector: 'app-apptype-viewer',
  templateUrl: './apptype-viewer.component.html',
  styleUrls: ['./apptype-viewer.component.scss']
})
export class ApptypeViewerComponent extends BaseControllerDirective implements OnChanges {

  @Input() activeAppTypes: ApplicationType[];
  @Input() inactiveAppTypes: ApplicationType[];
  allAppTypes: ApplicationType[];
  allAppTypesListSettings: ListSettings;
  appTypesListSettings: ListSettings;

  constructor(public dataService: DataService, private settings: SettingsService, injector: Injector) {
    super(injector);
  }

  setup(): void {
    this.allAppTypesListSettings = this.settings.getNewOrExistingAppTypeListSettings(true);
    this.appTypesListSettings = this.settings.getNewOrExistingAppTypeListSettings();
    this.allAppTypes = this.activeAppTypes.concat(this.inactiveAppTypes);
  }

  ngOnChanges(): void { 
    this.allAppTypes = this.activeAppTypes.concat(this.inactiveAppTypes);
  }

}
