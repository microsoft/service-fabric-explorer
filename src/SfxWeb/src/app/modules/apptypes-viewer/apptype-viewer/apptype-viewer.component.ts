import { Component, Input, OnChanges } from '@angular/core';
import { ApplicationType } from 'src/app/Models/DataModels/ApplicationType';
import { ListSettings } from 'src/app/Models/ListSettings';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';

@Component({
  selector: 'app-apptype-viewer',
  templateUrl: './apptype-viewer.component.html',
  styleUrls: ['./apptype-viewer.component.scss']
})
export class ApptypeViewerComponent implements OnChanges {

  @Input() activeAppTypes: ApplicationType[];
  @Input() inactiveAppTypes: ApplicationType[];
  allAppTypes: ApplicationType[];
  allAppTypesListSettings: ListSettings;
  appTypesListSettings: ListSettings;

  constructor(public dataService: DataService, private settings: SettingsService) {}

  ngOnChanges(): void { 
    this.allAppTypesListSettings = this.settings.getNewOrExistingAppTypeListSettings(true);
    this.appTypesListSettings = this.settings.getNewOrExistingAppTypeListSettings();
    this.allAppTypes = this.activeAppTypes.concat(this.inactiveAppTypes);
  }

}
