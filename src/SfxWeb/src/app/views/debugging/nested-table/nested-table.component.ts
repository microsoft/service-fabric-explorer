// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, OnInit } from '@angular/core';
import { IRequestsData } from 'src/app/Models/DataModels/networkDebugger';
import { ListColumnSetting, ListSettings } from 'src/app/Models/ListSettings';
import { SettingsService } from 'src/app/services/settings.service';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';

@Component({
  selector: 'app-nested-table',
  templateUrl: './nested-table.component.html',
  styleUrls: ['./nested-table.component.scss']
})
export class NestedTableComponent implements DetailBaseComponent, OnInit {

  item: IRequestsData;
  listSetting: ListColumnSetting;
  listSettings: ListSettings;

  constructor(private settings: SettingsService) { }

  ngOnInit(): void {
    this.listSettings = this.settings.getNewOrExistingNetworkRequestListSettings();
  }
}
