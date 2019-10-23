import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NodesRoutingModule } from './nodes-routing.module';
import { BaseComponent } from './base/base.component';
import { AllNodesComponent } from './all-nodes/all-nodes.component';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [BaseComponent, AllNodesComponent],
  imports: [
    CommonModule,
    NodesRoutingModule,
    SharedModule
  ]
})
export class NodesModule { }
