// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { IConcurrentEvents } from 'src/app/Models/eventstore/rcaEngine';
import { RelatedEventsConfigs } from 'src/app/Models/eventstore/RelatedEventsConfigs';
import { Utils } from 'src/app/Utils/Utils';

@Component({
  selector: 'app-rca-summary',
  templateUrl: './rca-summary.component.html',
  styleUrls: ['./rca-summary.component.scss']
})
export class RcaSummaryComponent implements OnChanges {

  @Input() events: IConcurrentEvents[] = [];

  data: Record<string, IConcurrentEvents[]> = {};
  constructor() { }

  ngOnChanges(): void {
    const explained = this.events.filter(event => RelatedEventsConfigs.some(config => config.eventType === event.kind));
    this.data = Utils.groupByFunc<IConcurrentEvents>(explained, item => item.kind);
  }
}
