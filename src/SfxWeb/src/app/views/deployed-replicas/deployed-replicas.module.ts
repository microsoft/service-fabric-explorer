import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DeployedReplicasRoutingModule } from './deployed-replicas-routing.module';
import { BaseComponent } from './base/base.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { DetailListTemplatesModule } from 'src/app/modules/detail-list-templates/detail-list-templates.module';


@NgModule({
  declarations: [BaseComponent],
  imports: [
    CommonModule,
    DeployedReplicasRoutingModule,
    SharedModule,
    DetailListTemplatesModule
  ]
})
export class DeployedReplicasModule { }
