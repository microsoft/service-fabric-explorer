// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, Input } from '@angular/core';
import { IResourceItem } from 'src/app/modules/charts/resources-tile/resources-tile.component';

@Component({
  selector: 'app-resource-item',
  templateUrl: './resource-item.component.html',
  styleUrls: ['./resource-item.component.scss']
})
export class ResourceItemComponent {

  @Input() item: IResourceItem;
  @Input() underline = false;

  constructor() { }
}
