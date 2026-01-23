// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component } from '@angular/core';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { ListColumnSetting } from 'src/app/Models/ListSettings';
import { ApplicationType } from 'src/app/Models/DataModels/ApplicationType';

@Component({
  selector: 'app-action-row',
  templateUrl: './action-row.component.html',
  styleUrls: ['./action-row.component.scss']
})
export class ActionRowComponent implements DetailBaseComponent {

  item: ApplicationType;
  listSetting: ListColumnSettingForApplicationType;

  constructor() { }

}

export class ListColumnSettingForApplicationType extends ListColumnSetting {
  template = ActionRowComponent;
  public constructor() {
      super('actions', 'Actions', {enableFilter: false});
  }
}
