import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ApplicationTypeRoutingModule } from './application-type-routing.module';
import { BaseComponent } from './base/base.component';
import { EssentialsComponent } from './essentials/essentials.component';
import { DetailsComponent } from './details/details.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { DetailListTemplatesModule } from 'src/app/modules/detail-list-templates/detail-list-templates.module';


@NgModule({
  declarations: [BaseComponent, EssentialsComponent, DetailsComponent],
  imports: [
    CommonModule,
    ApplicationTypeRoutingModule,
    SharedModule,
    DetailListTemplatesModule
  ]
})
export class ApplicationTypeModule { }
