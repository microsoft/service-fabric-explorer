// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HealthViewerComponent } from './health-viewer/health-viewer.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgbNavModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { DetailListTemplatesModule } from '../detail-list-templates/detail-list-templates.module';



@NgModule({
  declarations: [HealthViewerComponent],
  imports: [
    CommonModule,
    SharedModule,
    NgbTooltipModule,
    DetailListTemplatesModule,
    NgbNavModule
  ],
  exports: [HealthViewerComponent]
})
export class HealthStateModule { }
