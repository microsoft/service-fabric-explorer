// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { ListColumnSetting } from 'src/app/Models/ListSettings';
import { FabricEventBase } from 'src/app/Models/eventstore/Events';

@Component({
  selector: 'app-full-description',
  templateUrl: './full-description.component.html',
  styleUrls: ['./full-description.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FullDescriptionComponent implements DetailBaseComponent, OnInit {

  copyText = '';
  @Input() item: FabricEventBase;
  listSetting: ListColumnSetting;

  color =  'white';
  constructor() { }

  ngOnInit() {
    this.copyText = JSON.stringify(this.item.raw.raw, null, '\t');
  }
}
