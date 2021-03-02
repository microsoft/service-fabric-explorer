import { Component, OnInit } from '@angular/core';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { ListColumnSettingWithUtcTime } from 'src/app/Models/ListSettings';
import { Utils } from 'src/app/Utils/Utils';

@Component({
  selector: 'app-utc-timestamp',
  templateUrl: './utc-timestamp.component.html',
  styleUrls: ['./utc-timestamp.component.scss']
})
export class UtcTimestampComponent implements DetailBaseComponent, OnInit {

  item: any;
  listSetting: ListColumnSettingWithUtcTime;
  value: any;

  constructor() { }

  ngOnInit() {
    this.value = Utils.result(this.item, this.listSetting.propertyPath);
  }
}
