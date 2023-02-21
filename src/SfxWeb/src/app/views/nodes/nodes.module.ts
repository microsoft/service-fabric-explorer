import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NodesRoutingModule } from './nodes-routing.module';
import { BaseComponent } from './base/base.component';
import { AllNodesComponent } from './all-nodes/all-nodes.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { EventsComponent } from './events/events.component';
import { DetailListTemplatesModule } from 'src/app/modules/detail-list-templates/detail-list-templates.module';
import { EventStoreModule } from 'src/app/modules/event-store/event-store.module';
import { ChartsModule } from 'src/app/modules/charts/charts.module';
import { CommandsComponent } from './commands/commands.component';
import { PowershellCommandsModule } from 'src/app/modules/powershell-commands/powershell-commands.module';


@NgModule({
  declarations: [BaseComponent, AllNodesComponent, EventsComponent, CommandsComponent],
  imports: [
    CommonModule,
    NodesRoutingModule,
    SharedModule,
    DetailListTemplatesModule,
    EventStoreModule,
    ChartsModule,
    PowershellCommandsModule
  ]
})
export class NodesModule { }
