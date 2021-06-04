import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CombinedEventsRoutingModule } from './combined-events-routing.module';
import { BaseComponent } from './base/base.component';
import { EventsComponent } from './events/events.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { DetailListTemplatesModule } from 'src/app/modules/detail-list-templates/detail-list-templates.module';
import { EventStoreModule } from 'src/app/modules/event-store/event-store.module';
import { ChartsModule } from 'src/app/modules/charts/charts.module';

@NgModule({
  declarations: [BaseComponent, EventsComponent],
  imports: [
    CommonModule,
    CombinedEventsRoutingModule,
    SharedModule,
    DetailListTemplatesModule,
    EventStoreModule,
    ChartsModule
  ]
})
export class CombinedEventsModule { }
