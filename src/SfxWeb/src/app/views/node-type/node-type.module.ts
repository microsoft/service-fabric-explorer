import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodeTypesComponent } from './node-types/node-types.component';
import { BaseComponent } from './base/base.component';
import { NodeTypeRoutingModule } from './node-type-routing.module';
import { DetailListTemplatesModule } from 'src/app/modules/detail-list-templates/detail-list-templates.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { EventStoreModule } from 'src/app/modules/event-store/event-store.module';
import { ChartsModule } from 'src/app/modules/charts/charts.module';
import { EventsComponent } from './events/events.component';



@NgModule({
  declarations: [
    NodeTypesComponent,
    BaseComponent,
    EventsComponent
  ],
  imports: [
    CommonModule,
    NodeTypeRoutingModule,
    SharedModule,
    DetailListTemplatesModule,
    EventStoreModule,
    ChartsModule
  ]
})
export class NodeTypeModule { }
