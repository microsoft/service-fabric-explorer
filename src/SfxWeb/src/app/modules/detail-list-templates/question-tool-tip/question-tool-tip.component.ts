// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, OnInit } from '@angular/core';
import { RepairTask } from 'src/app/Models/DataModels/repairTask';
import { ListColumnSetting } from 'src/app/Models/ListSettings';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';

@Component({
  selector: 'app-question-tool-tip',
  templateUrl: './question-tool-tip.component.html',
  styleUrls: ['./question-tool-tip.component.scss']
})
export class QuestionToolTipComponent implements  OnInit, DetailBaseComponent {

  item: RepairTask;
  listSetting: ListColumnSetting;

  tooltipText: {tooltip: string, type: string};

  constructor() { }

  ngOnInit() {
    this.tooltipText = this.item.tooltipInfo();
  }

}
