// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, OnInit } from '@angular/core';
import { ListColumnSetting } from 'src/app/Models/ListSettings';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { ImageStoreItem, ImageStore } from 'src/app/Models/DataModels/ImageStore';

@Component({
  selector: 'app-display-name-column',
  templateUrl: './display-name-column.component.html',
  styleUrls: ['./display-name-column.component.scss']
})
export class DisplayNameColumnComponent implements DetailBaseComponent {

  item: ImageStoreItem;
  listSetting: ListColumnSettingWithDisplayName;

  constructor() { }

    openFolder(): void {
      this.listSetting.imagestore.expandFolder(this.item.path);
    }
}

export class ListColumnSettingWithDisplayName extends ListColumnSetting {
  template = DisplayNameColumnComponent;
  imagestore: ImageStore;
  public constructor(imagestore: ImageStore) {
      super('displayName', 'name', {sortPropertyPaths: ['isFolder', 'displayName']});
      this.imagestore = imagestore;
  }
}
