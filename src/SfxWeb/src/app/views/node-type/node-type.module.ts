import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NodeTypeRoutingModule } from './node-type-routing.module';
import { EssentialComponent } from './essential/essential.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { DetailListTemplatesModule } from 'src/app/modules/detail-list-templates/detail-list-templates.module';
import { ClusterModule } from '../cluster/cluster.module';
import { ChartsModule } from 'src/app/modules/charts/charts.module';


@NgModule({
  declarations: [EssentialComponent],
  imports: [
    CommonModule,
    NodeTypeRoutingModule,
    SharedModule,
    DetailListTemplatesModule,
    ClusterModule,
    ChartsModule
  ]
})
export class NodeTypeModule { }
