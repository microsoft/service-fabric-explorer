// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SystemApplicationsRoutingModule } from './system-applications-routing.module';
import { EssentialsComponent } from './essentials/essentials.component';
import { BaseComponent } from './base/base.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { DetailListTemplatesModule } from 'src/app/modules/detail-list-templates/detail-list-templates.module';
import { HealthStateModule } from 'src/app/modules/health-state/health-state.module';
import { EventStoreModule } from 'src/app/modules/event-store/event-store.module';
import { ChartsModule } from 'src/app/modules/charts/charts.module';


@NgModule({
  declarations: [EssentialsComponent, BaseComponent],
  imports: [
    CommonModule,
    SystemApplicationsRoutingModule,
    SharedModule,
    DetailListTemplatesModule,
    HealthStateModule,
    ChartsModule
  ]
})
export class SystemApplicationsModule { }
