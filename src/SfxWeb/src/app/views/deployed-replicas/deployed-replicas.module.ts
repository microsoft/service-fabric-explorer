import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DeployedReplicasRoutingModule } from './deployed-replicas-routing.module';
import { BaseComponent } from './base/base.component';


@NgModule({
  declarations: [BaseComponent],
  imports: [
    CommonModule,
    DeployedReplicasRoutingModule
  ]
})
export class DeployedReplicasModule { }
