// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-dashboard-text-tile',
  templateUrl: './dashboard-text-tile.component.html',
  styleUrls: ['./dashboard-text-tile.component.scss']
})
export class DashboardTextTileComponent {

  @Input() barClass = '';
  @Input() title: string;
  @Input() count: string | number;
  @Input() link: string;
  @Input() middleMargin = '15px 0';
  @Input() helpTextLink = '';
  constructor() { }

}
