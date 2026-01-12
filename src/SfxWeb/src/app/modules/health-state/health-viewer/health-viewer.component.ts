// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, Input, OnInit } from '@angular/core';
import { HealthEvaluation } from 'src/app/Models/DataModels/Shared';
import { ListSettings } from 'src/app/Models/ListSettings';
import { IRawUnhealthyEvaluation } from 'src/app/Models/RawDataTypes';
import { SettingsService } from 'src/app/services/settings.service';

@Component({
  selector: 'app-health-viewer',
  templateUrl: './health-viewer.component.html',
  styleUrls: ['./health-viewer.component.scss']
})
export class HealthViewerComponent implements OnInit {

  @Input() unhealthyEvaluations: IRawUnhealthyEvaluation[];
  @Input() healthyEvaluations: HealthEvaluation[];

  unhealthyEvaluationsListSettings: ListSettings;
  healthEventsListSettings: ListSettings;

  constructor(private settings: SettingsService) { }

  ngOnInit(): void {
    this.unhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings();
    this.healthEventsListSettings = this.settings.getNewOrExistingHealthEventsListSettings();
  }

}
