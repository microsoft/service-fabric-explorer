// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, OnInit } from '@angular/core';
import { ListColumnSettingForBadge } from 'src/app/Models/ListSettings';
import { ITextAndBadge } from 'src/app/Utils/ValueResolver';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';

@Component({
  selector: 'app-healthbadge',
  templateUrl: './healthbadge.component.html',
  styleUrls: ['./healthbadge.component.scss']
})
export class HealthbadgeComponent implements OnInit, DetailBaseComponent {

  item: any;
  listSetting: ListColumnSettingForBadge;

  value: ITextAndBadge;

  constructor() { }

  ngOnInit() {
    this.value = this.listSetting.getValue(this.item);
  }
}

