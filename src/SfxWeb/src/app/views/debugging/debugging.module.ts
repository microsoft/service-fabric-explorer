// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RequestLoggingComponent } from './request-logging/request-logging.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { DetailListTemplatesModule } from 'src/app/modules/detail-list-templates/detail-list-templates.module';
import { NestedTableComponent } from './nested-table/nested-table.component';
import { FormsModule } from '@angular/forms';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { DebuggingRoutingModule } from './debugging-routing.module';

@NgModule({
  declarations: [RequestLoggingComponent, NestedTableComponent],
  imports: [
    CommonModule,
    SharedModule,
    DetailListTemplatesModule,
    FormsModule,
    NgbNavModule,
    DebuggingRoutingModule
  ],
  exports: [RequestLoggingComponent],
})
export class DebuggingModule { }
