import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DeployedCodePackageRoutingModule } from './deployed-code-package-routing.module';
import { BaseComponent } from './base/base.component';
import { EssentialsComponent } from './essentials/essentials.component';
import { DetailsComponent } from './details/details.component';
import { ContainerLogsComponent } from './container-logs/container-logs.component';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [BaseComponent, EssentialsComponent, DetailsComponent, ContainerLogsComponent],
  imports: [
    CommonModule,
    DeployedCodePackageRoutingModule,
    SharedModule
  ]
})
export class DeployedCodePackageModule { }
