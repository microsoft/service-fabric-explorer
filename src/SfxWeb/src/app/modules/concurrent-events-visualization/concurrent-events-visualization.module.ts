import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VisualizationToolComponent } from './visualization-tool/visualization-tool.component';
import { VisualizationLogoComponent } from './visualization-logo/visualization-logo.component';
import { RcaSummaryComponent } from './rca-summary/rca-summary.component';
import { RcaOverviewComponent } from './rca-overview/rca-overview.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { RelationViewerComponent } from './relation-viewer/relation-viewer.component';
import { SqlQueryComponent } from './sql-query/sql-query.component';
import { FormsModule } from '@angular/forms';
import { DetailListTemplatesModule } from '../detail-list-templates/detail-list-templates.module';

@NgModule({
  declarations: [
    VisualizationToolComponent,
    VisualizationLogoComponent,
    RcaSummaryComponent,
    RcaOverviewComponent,
    RelationViewerComponent,
    SqlQueryComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    NgbNavModule,
    FormsModule,
    DetailListTemplatesModule
  ],
  exports:[
    VisualizationToolComponent,
    RcaSummaryComponent,
    SqlQueryComponent
  ]
})
export class ConcurrentEventsVisualizationModule { }
