import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ClusterRoutingModule } from './cluster-routing.module';
import { EssentialsComponent } from './essentials/essentials.component';
import { DetailsComponent } from './details/details.component';
import { BaseComponent } from './base/base.component';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [EssentialsComponent, DetailsComponent, BaseComponent],
  imports: [
    CommonModule,
    ClusterRoutingModule,
    SharedModule
  ]
})
export class ClusterModule { }
