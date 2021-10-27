import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SystemApplicationsRoutingModule } from './system-applications-routing.module';
import { EssentialsComponent } from './essentials/essentials.component';
import { BaseComponent } from './base/base.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { DetailListTemplatesModule } from 'src/app/modules/detail-list-templates/detail-list-templates.module';
import { HealthStateModule } from 'src/app/modules/health-state/health-state.module';


@NgModule({
  declarations: [EssentialsComponent, BaseComponent],
  imports: [
    CommonModule,
    SystemApplicationsRoutingModule,
    SharedModule,
    DetailListTemplatesModule,
    HealthStateModule
  ]
})
export class SystemApplicationsModule { }
