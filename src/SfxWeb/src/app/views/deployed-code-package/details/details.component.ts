// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, Injector } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { DeployedCodePackageBaseControllerDirective } from '../DeployedCodePackageBase';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent extends DeployedCodePackageBaseControllerDirective {

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }
}
