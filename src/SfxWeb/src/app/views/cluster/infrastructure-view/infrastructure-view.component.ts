// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, Injector, OnInit } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { InfrastructureCollection } from 'src/app/Models/DataModels/collections/infrastructureCollection';
import { RepairTaskCollection } from 'src/app/Models/DataModels/collections/RepairTaskCollection';
import { InfrastructureJob } from 'src/app/Models/DataModels/infrastructureJob';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';

@Component({
  selector: 'app-infrastructure-view',
  templateUrl: './infrastructure-view.component.html',
  styleUrls: ['./infrastructure-view.component.scss']
})
export class InfrastructureViewComponent extends BaseControllerDirective {
  public collection: InfrastructureCollection;
  public repairTaskCollection: RepairTaskCollection;

  allPendingMRJobs: InfrastructureJob[] = [];
  executingMRJobs: InfrastructureJob[] = [];

  constructor(private data: DataService, injector: Injector, private settings: SettingsService) {
    super(injector);
  }

  setup() {
    this.collection = this.data.infrastructureCollection;
    this.repairTaskCollection = this.data.repairCollection;
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return forkJoin([
      this.collection.refresh(messageHandler),
      this.repairTaskCollection.refresh(messageHandler)
    ])
  }
}
