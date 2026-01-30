// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApptypeViewerComponent } from './apptype-viewer/apptype-viewer.component';
import { NgbNavModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { DetailListTemplatesModule } from '../detail-list-templates/detail-list-templates.module';
import { SharedModule } from 'src/app/shared/shared.module';



@NgModule({
  declarations: [
    ApptypeViewerComponent
  ],
  imports: [
    CommonModule,
    NgbNavModule,
    NgbTooltipModule,
    DetailListTemplatesModule,
    SharedModule
  ],
  exports: [
    ApptypeViewerComponent
  ]
})
export class ApptypesViewerModule { }
