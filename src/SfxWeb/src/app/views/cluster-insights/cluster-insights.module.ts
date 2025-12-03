import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from 'src/app/shared/shared.module';
import { DetailListTemplatesModule } from 'src/app/modules/detail-list-templates/detail-list-templates.module';
import { ChartsModule } from 'src/app/modules/charts/charts.module';
import { ClusterInsightsRoutingModule } from './cluster-insights-routing.module';
import { ClusterInsightsComponent } from './cluster-insights.component';
import { ReplicaListComponent } from './replica-list/replica-list.component';
import { FmmLocationComponent } from './fmm-location/fmm-location.component';
import { FMMNodesComponent } from './nodes/nodes.component';
import { RecoveryProgressComponent } from './recovery-progress/recovery-progress.component';
import { ExpandableLinkComponent } from './replica-id-link/replica-id-link.component';
import { ReplicaDetailsComponent } from './replica-details-html/replica-details-html.component';

@NgModule({
  declarations: [
    ClusterInsightsComponent,
    ReplicaListComponent,
    FmmLocationComponent,
    FMMNodesComponent,
    RecoveryProgressComponent,
    ExpandableLinkComponent,
    ReplicaDetailsComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    DetailListTemplatesModule,
    NgbNavModule,
    ChartsModule,
    ClusterInsightsRoutingModule
  ],
  exports: [ClusterInsightsComponent]
})
export class ClusterInsightsModule { }
