// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfrastructureJobTileComponent } from './infrastructure-job-tile/infrastructure-job-tile.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { DetailListTemplatesModule } from '../detail-list-templates/detail-list-templates.module';
import { NgbNavModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { StripPrefixPipe } from './strip-prefix.pipe';
import { RepairTasksModule } from '../repair-tasks/repair-tasks.module';
import { InfrastructureOverviewComponent } from './infrastructure-overview/infrastructure-overview.component';
import { ChartsModule } from '../charts/charts.module';

@NgModule({
  declarations: [
    InfrastructureJobTileComponent,
    StripPrefixPipe,
    InfrastructureOverviewComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    DetailListTemplatesModule,
    RepairTasksModule,
    NgbNavModule,
    ChartsModule,
    NgbTooltipModule
  ],
  exports: [
    InfrastructureJobTileComponent,
    StripPrefixPipe,
    InfrastructureOverviewComponent
  ]
})
export class InfrastructureJobModule { }
