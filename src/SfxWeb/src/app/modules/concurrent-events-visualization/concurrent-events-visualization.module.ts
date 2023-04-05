import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VisualizationToolComponent } from './visualization-tool/visualization-tool.component';
import { VisualizationLogoComponent } from './visualization-logo/visualization-logo.component';
import { RcaSummaryComponent } from './rca-summary/rca-summary.component';
import { RcaOverviewComponent } from './rca-overview/rca-overview.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { RelationViewerComponent } from './relation-viewer/relation-viewer.component';
import { TimeseriesComponent } from './timeseries/timeseries.component';
import { DetailListTemplatesModule } from '../detail-list-templates/detail-list-templates.module';
import { TimeseriesItemComponent } from './timeseries-item/timeseries-item.component';

@NgModule({
  declarations: [
    VisualizationToolComponent,
    VisualizationLogoComponent,
    RcaSummaryComponent,
    RcaOverviewComponent,
    RelationViewerComponent,
    TimeseriesComponent,
    TimeseriesItemComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    NgbNavModule,
    DetailListTemplatesModule,
    NgbNavModule
  ],
  exports:[
    VisualizationToolComponent,
    RcaSummaryComponent,
    TimeseriesComponent
  ]
})
export class ConcurrentEventsVisualizationModule { }
