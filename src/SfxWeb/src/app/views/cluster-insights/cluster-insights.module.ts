import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { DetailListTemplatesModule } from 'src/app/modules/detail-list-templates/detail-list-templates.module';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { ReplicaListComponent } from './replica-list/replica-list.component';
import { ClusterInsightsRoutingModule } from './cluster-insights-routing.module';
import { FmmLocationComponent } from './fmm-location/fmm-location.component';
import { ChartsModule } from 'src/app/modules/charts/charts.module';

@NgModule({
  declarations: [ReplicaListComponent, FmmLocationComponent],
  imports: [
    SharedModule,
    DetailListTemplatesModule,
    NgbNavModule,
    ChartsModule,
    ClusterInsightsRoutingModule
  ],
  exports: [ReplicaListComponent]
})
export class ClusterInsightsModule { }
