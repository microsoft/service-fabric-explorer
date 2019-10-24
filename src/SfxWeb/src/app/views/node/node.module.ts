import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NodeRoutingModule } from './node-routing.module';
import { BaseComponent } from './base/base.component';
import { EssentialsComponent } from './essentials/essentials.component';
import { DetailsComponent } from './details/details.component';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [BaseComponent, EssentialsComponent, DetailsComponent],
  imports: [
    CommonModule,
    NodeRoutingModule,
    SharedModule
  ]
})
export class NodeModule { }
