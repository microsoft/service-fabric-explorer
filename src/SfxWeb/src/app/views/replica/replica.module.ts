import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReplicaRoutingModule } from './replica-routing.module';
import { BaseComponent } from './base/base.component';
import { DetailsComponent } from './details/details.component';
import { EssentialsComponent } from './essentials/essentials.component';
import { EventsComponent } from './events/events.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { DetailListTemplatesModule } from 'src/app/modules/detail-list-templates/detail-list-templates.module';
import { EventStoreModule } from 'src/app/modules/event-store/event-store.module';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ChartsModule } from 'src/app/modules/charts/charts.module';
import { HealthStateModule } from 'src/app/modules/health-state/health-state.module';
import { CommandsComponent } from './commands/commands.component';
import { PowershellCommandsModule } from 'src/app/modules/powershell-commands/powershell-commands.module';


@NgModule({
  declarations: [BaseComponent, DetailsComponent, EssentialsComponent, EventsComponent, CommandsComponent],
  imports: [
    CommonModule,
    ReplicaRoutingModule,
    SharedModule,
    DetailListTemplatesModule,
    EventStoreModule,
    NgbTooltipModule,
    ChartsModule,
    HealthStateModule,
    PowershellCommandsModule
  ]
})
export class ReplicaModule { }
