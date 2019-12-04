import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReplicaRoutingModule } from './replica-routing.module';
import { BaseComponent } from './base/base.component';
import { DetailsComponent } from './details/details.component';
import { EssentialsComponent } from './essentials/essentials.component';
import { EventsComponent } from './events/events.component';


@NgModule({
  declarations: [BaseComponent, DetailsComponent, EssentialsComponent, EventsComponent],
  imports: [
    CommonModule,
    ReplicaRoutingModule
  ]
})
export class ReplicaModule { }
