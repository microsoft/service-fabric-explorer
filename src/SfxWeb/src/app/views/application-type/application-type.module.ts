import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ApplicationTypeRoutingModule } from './application-type-routing.module';
import { BaseComponent } from './base/base.component';
import { EssentialsComponent } from './essentials/essentials.component';
import { DetailsComponent } from './details/details.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { DetailListTemplatesModule } from 'src/app/modules/detail-list-templates/detail-list-templates.module';
import { ActionRowComponent } from './action-row/action-row.component';


@NgModule({
  declarations: [BaseComponent, EssentialsComponent, DetailsComponent, ActionRowComponent],
  imports: [
    CommonModule,
    ApplicationTypeRoutingModule,
    SharedModule,
    DetailListTemplatesModule
  ],
  entryComponents: [ActionRowComponent]
})
export class ApplicationTypeModule { }
