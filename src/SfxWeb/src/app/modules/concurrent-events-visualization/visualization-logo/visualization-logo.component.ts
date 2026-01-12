// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, OnInit } from '@angular/core';
import { IRCAItem } from 'src/app/Models/eventstore/rcaEngine';
import { ListColumnSetting, ListColumnSettingWithEmbeddedVis } from 'src/app/Models/ListSettings';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-visualization-logo',
  templateUrl: './visualization-logo.component.html',
  styleUrls: ['./visualization-logo.component.scss']
})
export class VisualizationLogoComponent implements OnInit, DetailBaseComponent {

  visPresent: boolean;
  item: IRCAItem;
  listSetting: ListColumnSettingWithEmbeddedVis;

  public assetBase = environment.assetBase;

  ngOnInit() {
    this.visPresent = !!this.listSetting.visEvents[this.item.eventInstanceId];
  }

}
