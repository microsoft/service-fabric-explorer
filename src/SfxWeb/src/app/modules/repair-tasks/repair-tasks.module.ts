// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RepairJobChartComponent } from './repair-job-chart/repair-job-chart.component';
import { RepairTaskViewComponent } from './repair-task-view/repair-task-view.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { DetailListTemplatesModule } from '../detail-list-templates/detail-list-templates.module';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';



@NgModule({
  declarations: [RepairJobChartComponent, RepairTaskViewComponent],
  imports: [
    CommonModule,
    SharedModule,
    DetailListTemplatesModule,
    NgbNavModule,
    RouterModule
  ],
  exports: [RepairJobChartComponent, RepairTaskViewComponent]
})
export class RepairTasksModule { }
