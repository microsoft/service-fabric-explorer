import { Component, OnInit } from '@angular/core';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { ListColumnSettingWithUtcTime } from 'src/app/Models/ListSettings';

@Component({
  selector: 'app-utc-timestamp',
  templateUrl: './utc-timestamp.component.html',
  styleUrls: ['./utc-timestamp.component.scss']
})
export class UtcTimestampComponent implements DetailBaseComponent {

  item: any;
  listSetting: ListColumnSettingWithUtcTime;

  constructor() { }

  ngOnInit(): void {
  }

}
