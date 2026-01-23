// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, OnInit } from '@angular/core';
import { RepairTask } from 'src/app/Models/DataModels/repairTask';
import { ListColumnSettingWithShorten } from 'src/app/Models/ListSettings';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';

@Component({
  selector: 'app-shorten',
  templateUrl: './shorten.component.html',
  styleUrls: ['./shorten.component.scss']
})
export class ShortenComponent implements DetailBaseComponent, OnInit {

  item: RepairTask;
  listSetting: ListColumnSettingWithShorten;
  value: string | any[];
  cache: any;

  displayValue: string | any[];
  overflow = false;
  constructor() { }

  ngOnInit() {
    this.value = this.listSetting.getValue(this.item);
    this.overflow = this.value.length > this.listSetting.maxWidth;
    this.displayValue = this.value.slice(0, this.listSetting.maxWidth).toString();
  }

  flipState() {
    const id = this.item.id;
    if (id in this.cache) {
      this.cache[id] = !this.cache[id];
    }else{
      this.cache[id] = true;
    }
  }
}
