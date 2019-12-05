import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DeployedCodePackagesRoutingModule } from './deployed-code-packages-routing.module';
import { BaseComponent } from './base/base.component';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [BaseComponent],
  imports: [
    CommonModule,
    DeployedCodePackagesRoutingModule,
    SharedModule
  ]
})
export class DeployedCodePackagesModule { }
