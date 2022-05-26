import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgbDropdownModule, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { ChartsModule } from '../charts/charts.module';
import { EventStoreModule } from '../event-store/event-store.module';
import { DetailListTemplatesModule } from '../detail-list-templates/detail-list-templates.module';
import { RepairTasksComponent } from './repair-tasks/repair-tasks.component';
import { RepairTaskViewComponent } from './repair-task-view/repair-task-view.component';
import { RepairJobChartComponent } from './repair-job-chart/repair-job-chart.component';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [RepairTasksComponent, RepairTaskViewComponent, RepairJobChartComponent],
  imports: [
    CommonModule,
    SharedModule,
    ChartsModule,
    NgbDropdownModule,
    NgbNavModule,
    EventStoreModule,
    DetailListTemplatesModule,
    RouterModule
  ],
  exports: [RepairTasksComponent, RepairTaskViewComponent, RepairJobChartComponent]
})
export class RepairJobsModule { }
