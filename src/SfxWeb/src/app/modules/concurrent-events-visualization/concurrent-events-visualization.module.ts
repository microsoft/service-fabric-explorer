import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VisualizationToolComponent } from './visualization-tool/visualization-tool.component';
import { VisualizationLogoComponent } from './visualization-logo/visualization-logo.component';
import { RcaSummaryComponent } from './rca-summary/rca-summary.component';
import { RcaOverviewComponent } from './rca-overview/rca-overview.component';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [
    VisualizationToolComponent,
    VisualizationLogoComponent,
    RcaSummaryComponent,
    RcaOverviewComponent
  ],
  imports: [
    CommonModule,
    SharedModule
  ],
  exports:[
    VisualizationToolComponent,
    RcaSummaryComponent
  ]
})
export class ConcurrentEventsVisualizationModule { }
