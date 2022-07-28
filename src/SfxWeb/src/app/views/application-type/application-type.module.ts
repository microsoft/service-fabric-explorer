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


@NgModule({
    declarations: [BaseComponent, EssentialsComponent, DetailsComponent, ActionRowComponent, CreateApplicationComponent],
    imports: [
        CommonModule,
        ApplicationTypeRoutingModule,
        SharedModule,
        DetailListTemplatesModule,
        ReactiveFormsModule,
        FormsModule,
        NgbNavModule,
        NgbTooltipModule
    ]
})
export class ApplicationTypeModule { }
