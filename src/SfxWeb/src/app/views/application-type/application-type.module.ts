// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ApplicationTypeRoutingModule } from './application-type-routing.module';
import { BaseComponent } from './base/base.component';
import { EssentialsComponent } from './essentials/essentials.component';
import { DetailsComponent } from './details/details.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { DetailListTemplatesModule } from 'src/app/modules/detail-list-templates/detail-list-templates.module';
import { ActionRowComponent } from './action-row/action-row.component';
import { CreateApplicationComponent } from './create-application/create-application.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgbNavModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { CommandsComponent } from './commands/commands.component';
import { PowershellCommandsModule } from 'src/app/modules/powershell-commands/powershell-commands.module';
import { ApptypesViewerModule } from 'src/app/modules/apptypes-viewer/apptypes-viewer.module';


@NgModule({
    declarations: [BaseComponent, EssentialsComponent, DetailsComponent, ActionRowComponent, CreateApplicationComponent, CommandsComponent],
    imports: [
        CommonModule,
        ApplicationTypeRoutingModule,
        SharedModule,
        DetailListTemplatesModule,
        ReactiveFormsModule,
        FormsModule,
        NgbNavModule,
        NgbTooltipModule,
        PowershellCommandsModule,
        ApptypesViewerModule
    ]
})
export class ApplicationTypeModule { }
