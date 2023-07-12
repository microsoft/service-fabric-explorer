import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DeployedReplicaRoutingModule } from './deployed-replica-routing.module';
import { BaseComponent } from './base/base.component';
import { EssentialsComponent } from './essentials/essentials.component';
import { DetailsComponent } from './details/details.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { DetailListTemplatesModule } from 'src/app/modules/detail-list-templates/detail-list-templates.module';
import { ChartsModule } from 'src/app/modules/charts/charts.module';
import { CommandsComponent } from './commands/commands.component';
import { PowershellCommandsModule } from 'src/app/modules/powershell-commands/powershell-commands.module';


@NgModule({
  declarations: [BaseComponent, EssentialsComponent, DetailsComponent, CommandsComponent],
  imports: [
    CommonModule,
    DeployedReplicaRoutingModule,
    SharedModule,
    DetailListTemplatesModule,
    ChartsModule,
    PowershellCommandsModule
  ]
})
export class DeployedReplicaModule { }
