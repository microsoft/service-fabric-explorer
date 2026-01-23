// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, OnInit } from '@angular/core';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { ListColumnSettingWithUtcTime } from 'src/app/Models/ListSettings';

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
    this.value = this.listSetting.getValue(this.item);
  }
}
