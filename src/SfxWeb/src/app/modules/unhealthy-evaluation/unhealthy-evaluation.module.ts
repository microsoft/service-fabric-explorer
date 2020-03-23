import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HealthViewerComponent } from './health-viewer/health-viewer.component';
import { UnhealthyEvaluationsContainerComponent } from './unhealthy-evaluations-container/unhealthy-evaluations-container.component';
import { UnhealthyEvaluationComponent } from './unhealthy-evaluation/unhealthy-evaluation.component';
import { UnhealtyEvaluationChildFilterPipe } from './unhealty-evaluation-child-filter.pipe';
import { DetailListTemplatesModule } from '../detail-list-templates/detail-list-templates.module';
import { ListViewComponent } from './list-view/list-view.component';
import { NgbTabsetModule, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from 'src/app/shared/shared.module';
import { RouterModule } from '@angular/router';


@NgModule({
  declarations: [UnhealthyEvaluationsContainerComponent, UnhealthyEvaluationComponent, UnhealtyEvaluationChildFilterPipe, HealthViewerComponent, ListViewComponent  ],
  exports: [HealthViewerComponent],
  imports: [
    CommonModule,
    DetailListTemplatesModule,
    NgbTabsetModule,
    NgbNavModule,
    SharedModule,
    RouterModule
  ]
})
export class UnhealthyEvaluationModule { }
