// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ApplicationsRoutingModule } from './applications-routing.module';
import { BaseComponent } from './base/base.component';
import { AllComponent } from './all/all.component';
import { UpgradingComponent } from './upgrading/upgrading.component';
import { EventsComponent } from './events/events.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { DetailListTemplatesModule } from 'src/app/modules/detail-list-templates/detail-list-templates.module';
import { EventStoreModule } from 'src/app/modules/event-store/event-store.module';
import { ViewUpgradesListItemComponent } from './view-upgrades-list-item/view-upgrades-list-item.component';
import { UpgradeProgressModule } from 'src/app/modules/upgrade-progress/upgrade-progress.module';
import { ApptypesComponent } from './apptypes/apptypes.component';
import { ApptypesViewerModule } from 'src/app/modules/apptypes-viewer/apptypes-viewer.module';
import { CommandsComponent } from './commands/commands.component';
import { PowershellCommandsModule } from 'src/app/modules/powershell-commands/powershell-commands.module';
import { ChartsModule } from 'src/app/modules/charts/charts.module';


@NgModule({
  declarations: [BaseComponent, AllComponent, UpgradingComponent, EventsComponent, ViewUpgradesListItemComponent, ApptypesComponent, CommandsComponent],
  imports: [
    CommonModule,
    ApplicationsRoutingModule,
    SharedModule,
    DetailListTemplatesModule,
    EventStoreModule,
    UpgradeProgressModule,
    ApptypesViewerModule,
    PowershellCommandsModule,
    ChartsModule
  ]
})
export class ApplicationsModule { }
