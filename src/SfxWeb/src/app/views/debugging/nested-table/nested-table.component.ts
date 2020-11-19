import { Component, OnInit } from '@angular/core';
import { ListColumnSetting, ListColumnSettingWithUtcTime, ListSettings } from 'src/app/Models/ListSettings';
import { SettingsService } from 'src/app/services/settings.service';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { IRequestsData } from '../request-logging/request-logging.component';

@Component({
  selector: 'app-nested-table',
  templateUrl: './nested-table.component.html',
  styleUrls: ['./nested-table.component.scss']
})
export class NestedTableComponent implements DetailBaseComponent {

  item: IRequestsData;
  listSetting: ListColumnSetting;


  listSettings: ListSettings;

  constructor(private settings: SettingsService) { }

  ngOnInit(): void {
    this.listSettings = this.settings.getNewOrExistingNetworkRequestListSettings();
  }
}
