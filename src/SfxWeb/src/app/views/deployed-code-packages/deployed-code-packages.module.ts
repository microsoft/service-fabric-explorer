// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DeployedCodePackagesRoutingModule } from './deployed-code-packages-routing.module';
import { BaseComponent } from './base/base.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { DetailListTemplatesModule } from 'src/app/modules/detail-list-templates/detail-list-templates.module';


@NgModule({
  declarations: [BaseComponent],
  imports: [
    CommonModule,
    DeployedCodePackagesRoutingModule,
    SharedModule,
    DetailListTemplatesModule
  ]
})
export class DeployedCodePackagesModule { }
