// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, Input } from '@angular/core';
import { IEssentialListItem } from 'src/app/modules/charts/essential-health-tile/essential-health-tile.component';

@Component({
  selector: 'app-essential-item',
  templateUrl: './essential-item.component.html',
  styleUrls: ['./essential-item.component.scss']
})
export class EssentialItemComponent {

  @Input() item: IEssentialListItem;
  @Input() underline = false;

  constructor() { }
}
