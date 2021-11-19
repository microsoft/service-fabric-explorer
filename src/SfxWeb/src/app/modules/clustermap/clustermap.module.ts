import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusTileComponent } from './status-tile/status-tile.component';
import { MapComponent } from './map/map.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { SectionOverviewComponent } from './section-overview/section-overview.component';
import { ChartsModule } from '../charts/charts.module';
import { RouterModule } from '@angular/router';
import { NgbDropdownModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { NodeListComponent } from './node-list/node-list.component';

@NgModule({
  declarations: [
    StatusTileComponent,
    MapComponent,
    SectionOverviewComponent,
    NodeListComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    ChartsModule,
    RouterModule,
    NgbDropdownModule,
    FormsModule,
    NgbTooltipModule
  ],
  exports: [
    StatusTileComponent,
    MapComponent
  ]
})
export class ClustermapModule { }
