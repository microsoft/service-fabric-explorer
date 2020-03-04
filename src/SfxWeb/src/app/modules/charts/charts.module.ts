import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardTileComponent } from './dashboard-tile/dashboard-tile.component';
import { DashboardTextTileComponent } from './dashboard-text-tile/dashboard-text-tile.component';



@NgModule({
  declarations: [DashboardTileComponent, DashboardTextTileComponent],
  imports: [
    CommonModule
  ],
  exports: [DashboardTileComponent, DashboardTextTileComponent]
})
export class ChartsModule { }
