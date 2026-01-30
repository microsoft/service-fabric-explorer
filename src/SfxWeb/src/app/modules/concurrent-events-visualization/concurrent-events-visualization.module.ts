// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VisualizationToolComponent } from './visualization-tool/visualization-tool.component';
import { VisualizationLogoComponent } from './visualization-logo/visualization-logo.component';
import { RcaSummaryComponent } from './rca-summary/rca-summary.component';
import { RcaOverviewComponent } from './rca-overview/rca-overview.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgbDropdownModule, NgbNavModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { RelationViewerComponent } from './relation-viewer/relation-viewer.component';
import { TimeseriesComponent } from './timeseries/timeseries.component';
import { DetailListTemplatesModule } from '../detail-list-templates/detail-list-templates.module';
import { TimeseriesItemComponent } from './timeseries-item/timeseries-item.component';
import { NamingViewerComponent } from './naming-viewer/naming-viewer.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    VisualizationToolComponent,
    VisualizationLogoComponent,
    RcaSummaryComponent,
    RcaOverviewComponent,
    RelationViewerComponent,
    TimeseriesComponent,
    TimeseriesItemComponent,
    NamingViewerComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    NgbNavModule,
    DetailListTemplatesModule,
    NgbNavModule,
    FormsModule,
    NgbDropdownModule,
    NgbTooltipModule
  ],
  exports:[
    VisualizationToolComponent,
    RcaSummaryComponent,
    TimeseriesComponent,
    NamingViewerComponent
  ]
})
export class ConcurrentEventsVisualizationModule { }
