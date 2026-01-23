// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardTileComponent } from './dashboard-tile/dashboard-tile.component';
import { DashboardTextTileComponent } from './dashboard-text-tile/dashboard-text-tile.component';
import { BarChartComponent } from './bar-chart/bar-chart.component';
import { RouterModule } from '@angular/router';
import { DashboardTextScaleTileComponent } from './dashboard-text-scale-tile/dashboard-text-scale-tile.component';
import { EssentialHealthTileComponent, EssentialTemplateDirective } from './essential-health-tile/essential-health-tile.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { TileWrapperComponent } from './tile-wrapper/tile-wrapper.component';
import { HealthChartComponent } from './health-chart/health-chart.component';
import { ResourcesTileComponent } from './resources-tile/resources-tile.component';


@NgModule({
  declarations: [DashboardTileComponent, DashboardTextTileComponent, BarChartComponent, DashboardTextScaleTileComponent, EssentialHealthTileComponent, EssentialTemplateDirective,
                 TileWrapperComponent,
                 HealthChartComponent,
                 ResourcesTileComponent],
  imports: [
    CommonModule,
    RouterModule,
    SharedModule
  ],
  exports: [DashboardTileComponent, DashboardTextTileComponent, BarChartComponent, DashboardTextScaleTileComponent,
            EssentialHealthTileComponent, EssentialTemplateDirective, TileWrapperComponent, HealthChartComponent, ResourcesTileComponent]
})
export class ChartsModule { }
