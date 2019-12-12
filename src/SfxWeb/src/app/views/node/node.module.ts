import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NodeRoutingModule } from './node-routing.module';
import { BaseComponent } from './base/base.component';
import { EssentialsComponent } from './essentials/essentials.component';
import { DetailsComponent } from './details/details.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { DetailListTemplatesModule } from 'src/app/modules/detail-list-templates/detail-list-templates.module';
import { EventsComponent } from './events/events.component';
import { EventStoreModule } from 'src/app/modules/event-store/event-store.module';

@NgModule({
  declarations: [BaseComponent, EssentialsComponent, DetailsComponent, EventsComponent],
  imports: [
    CommonModule,
    NodeRoutingModule,
    SharedModule,
    DetailListTemplatesModule,
    EventStoreModule
  ]
})
export class NodeModule { }
