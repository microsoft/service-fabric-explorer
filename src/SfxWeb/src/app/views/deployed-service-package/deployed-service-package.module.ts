import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DeployedServicePackageRoutingModule } from './deployed-service-package-routing.module';
import { BaseComponent } from './base/base.component';
import { DetailsComponent } from './details/details.component';
import { ManifestComponent } from './manifest/manifest.component';


@NgModule({
  declarations: [BaseComponent, DetailsComponent, ManifestComponent],
  imports: [
    CommonModule,
    DeployedServicePackageRoutingModule
  ]
})
export class DeployedServicePackageModule { }
