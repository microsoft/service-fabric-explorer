import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ServiceRoutingModule } from './service-routing.module';
import { EssentialsComponent } from './essentials/essentials.component';
import { BaseComponent } from './base/base.component';
import { DetailsComponent } from './details/details.component';
import { ManifestComponent } from './manifest/manifest.component';
import { EventsComponent } from './events/events.component';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [EssentialsComponent, BaseComponent, DetailsComponent, ManifestComponent, EventsComponent],
  imports: [
    CommonModule,
    ServiceRoutingModule,
    SharedModule
  ]
})
export class ServiceModule { }
