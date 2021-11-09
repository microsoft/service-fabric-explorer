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


@NgModule({
  declarations: [DashboardTileComponent, DashboardTextTileComponent, BarChartComponent, DashboardTextScaleTileComponent, EssentialHealthTileComponent, EssentialTemplateDirective,
                 TileWrapperComponent,
                 HealthChartComponent],
  imports: [
    CommonModule,
    RouterModule,
    SharedModule
  ],
  exports: [DashboardTileComponent, DashboardTextTileComponent, BarChartComponent, DashboardTextScaleTileComponent, EssentialHealthTileComponent, EssentialTemplateDirective, TileWrapperComponent, HealthChartComponent]
})
export class ChartsModule { }
