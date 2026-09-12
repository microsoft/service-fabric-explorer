import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RepairJobChartComponent } from './repair-job-chart/repair-job-chart.component';
import { RepairTaskViewComponent } from './repair-task-view/repair-task-view.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { DetailListTemplatesModule } from '../detail-list-templates/detail-list-templates.module';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { RepairDurationComponent } from './repair-duration/repair-duration.component';



@NgModule({
  declarations: [RepairJobChartComponent, RepairTaskViewComponent, RepairDurationComponent],
  imports: [
    CommonModule,
    SharedModule,
    DetailListTemplatesModule,
    NgbNavModule,
    RouterModule
  ],
  exports: [RepairJobChartComponent, RepairTaskViewComponent, RepairDurationComponent]
})
export class RepairTasksModule { }
