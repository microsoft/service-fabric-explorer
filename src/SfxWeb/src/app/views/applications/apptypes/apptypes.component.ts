// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, Injector } from '@angular/core';
import { ApplicationsBaseControllerDirective } from '../applicationsBase';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-apptypes',
  templateUrl: './apptypes.component.html',
  styleUrls: ['./apptypes.component.scss']
})
export class ApptypesComponent  extends ApplicationsBaseControllerDirective {

  constructor(private dataService: DataService, injector: Injector) {
    super(dataService, injector);
  }
}
