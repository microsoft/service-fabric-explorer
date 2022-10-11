import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SystemApplicationsRoutingModule } from './system-applications-routing.module';
import { EssentialsComponent } from './essentials/essentials.component';
import { BaseComponent } from './base/base.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { DetailListTemplatesModule } from 'src/app/modules/detail-list-templates/detail-list-templates.module';
import { HealthStateModule } from 'src/app/modules/health-state/health-state.module';
import { ChartsModule } from 'src/app/modules/charts/charts.module';
import { NamingViewerComponent } from './naming-viewer/naming-viewer.component';
import { ConcurrentEventsVisualizationModule } from 'src/app/modules/concurrent-events-visualization/concurrent-events-visualization.module';
import { TimePickerModule } from 'src/app/modules/time-picker/time-picker.module';


@NgModule({
  declarations: [EssentialsComponent, BaseComponent, NamingViewerComponent],
  imports: [
    CommonModule,
    SystemApplicationsRoutingModule,
    SharedModule,
    DetailListTemplatesModule,
    HealthStateModule,
    ChartsModule,
    ConcurrentEventsVisualizationModule,
    TimePickerModule
  ]
})
export class SystemApplicationsModule { }
