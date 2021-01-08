import { Component, OnInit } from '@angular/core';
import { ListColumnSetting, ListColumnSettingWithCustomComponent, ListSettings } from 'src/app/Models/ListSettings';
import { RestClientService } from 'src/app/services/rest-client.service';
import { SettingsService } from 'src/app/services/settings.service';
import { NestedTableComponent } from '../nested-table/nested-table.component';

@Component({
  selector: 'app-request-logging',
  templateUrl: './request-logging.component.html',
  styleUrls: ['./request-logging.component.scss']
})
export class RequestLoggingComponent implements OnInit {

  listSettings: ListSettings;
  listSettingsRecent: ListSettings;
  constructor(private settings: SettingsService, public networkService: RestClientService) { }

  ngOnInit(): void {
    this.listSettingsRecent = this.settings.getNewOrExistingNetworkRequestListSettings(true);

    this.listSettings = this.settings.getNewOrExistingListSettings('requests', [], [
      new ListColumnSetting('apiDesc', 'API Description'),
      new ListColumnSetting('requestCount', '# of Requests'),
      new ListColumnSetting('averageDuration', 'Average Duration(MS)'),
      new ListColumnSetting('failureRate', 'Failure Rate'),
    ],
    [
      new ListColumnSettingWithCustomComponent(NestedTableComponent, '',
      '',
      {
        enableFilter: false,
        colspan: -1
      })
    ],
    true,
    (item) => true,
    true);
  }

}
