import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { DetailListTemplatesModule } from 'src/app/modules/detail-list-templates/detail-list-templates.module';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { ReplicaListComponent } from './replica-list/replica-list.component';
import { ClusterInsightsRoutingModule } from './cluster-insights-routing.module';
import { FmmLocationComponent } from './fmm-location/fmm-location.component';
import { ChartsModule } from 'src/app/modules/charts/charts.module';
import { FMMNodesComponent } from './fmm-nodes/all-nodes.component';
import { RecoveryProgressComponent } from './recovery-progress/recovery-progress.component';
import { ClickableReplicaIdComponent } from './clickable-replica-id/clickable-replica-id.component';
import { ReplicaDetailsHtmlComponent } from './replica-details-html/replica-details-html.component';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [ReplicaListComponent, FmmLocationComponent, FMMNodesComponent, RecoveryProgressComponent, ClickableReplicaIdComponent, ReplicaDetailsHtmlComponent],
  imports: [
    CommonModule,
    SharedModule,
    DetailListTemplatesModule,
    NgbNavModule,
    ChartsModule,
    ClusterInsightsRoutingModule
  ],
  exports: [ReplicaListComponent]
})
export class ClusterInsightsModule { }
