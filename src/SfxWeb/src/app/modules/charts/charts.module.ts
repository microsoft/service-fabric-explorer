import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardTileComponent } from './dashboard-tile/dashboard-tile.component';
import { DashboardTextTileComponent } from './dashboard-text-tile/dashboard-text-tile.component';
import { BarChartComponent } from './bar-chart/bar-chart.component';
import { RouterModule } from '@angular/router';
import { DashboardTextScaleTileComponent } from './dashboard-text-scale-tile/dashboard-text-scale-tile.component';


@NgModule({
  declarations: [DashboardTileComponent, DashboardTextTileComponent, BarChartComponent, DashboardTextScaleTileComponent],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports: [DashboardTileComponent, DashboardTextTileComponent, BarChartComponent, DashboardTextScaleTileComponent]
})
export class ChartsModule { }
