import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfrastructureJobTileComponent } from './infrastructure-job-tile/infrastructure-job-tile.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { DetailListTemplatesModule } from '../detail-list-templates/detail-list-templates.module';
import { ClusterModule } from 'src/app/views/cluster/cluster.module';



@NgModule({
  declarations: [
    InfrastructureJobTileComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    DetailListTemplatesModule,
    ClusterModule
  ],
  exports: [
    InfrastructureJobTileComponent
  ]
})
export class InfrastructureJobModule { }
