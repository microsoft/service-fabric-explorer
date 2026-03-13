// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { IRawSafetyCheckDescription } from 'src/app/Models/RawDataTypes';
import { DataService } from 'src/app/services/data.service';
import { MessageService, MessageSeverity } from 'src/app/services/message.service';
import { RestClientService } from 'src/app/services/rest-client.service';
import { RoutesService } from 'src/app/services/routes.service';
import { IPartitionData } from './safety-checks/safety-checks.component';

@Injectable({
  providedIn: 'root'
})
export class PartitionCacheService {

  partitions: Record<string, IPartitionData> = {};
  public partitionDataChanges: Subject<string> = new Subject();

  constructor(private dataService: DataService,
              private restClientService: RestClientService,
              private messageService: MessageService
    ) { }

  checkCache(partition: string) {
    return partition in this.partitions;
  }

  ensureInitialCache(check: IRawSafetyCheckDescription) {
    if (!this.checkCache(check.SafetyCheck.PartitionId)) {
      this.partitions[check.SafetyCheck.PartitionId] = {
        loading: 'unstarted',
        ...check
      };
  }

  }

  async getPartitionInfo(id: string, check: IRawSafetyCheckDescription) {
    this.partitions[id].loading = 'inflight';

    try {
      const partition = await this.restClientService.getPartitionById(id).toPromise();
      const serviceName = await this.restClientService.getServiceNameInfo(id).toPromise();
      const applicationName = await this.restClientService.getApplicationNameInfo(serviceName.Id).toPromise();

      let app;
      if (applicationName.Id === 'System') {
        app = await this.dataService.getSystemApp().toPromise();
      }else {
        app = await this.dataService.getApp(applicationName.Id).toPromise();
      }

      const route =  RoutesService.getPartitionViewPath(app.raw.TypeName, applicationName.Id,
        serviceName.Id, partition.PartitionInformation.Id);

      this.partitions[id] = {
        ...check,
        serviceName: serviceName.Id,
        applicationName: applicationName.Id,
        partition: partition.PartitionInformation.Id,
        link: route,
        applicationLink: RoutesService.getAppViewPath(app.raw.TypeName, applicationName.Id),
        serviceLink: RoutesService.getServiceViewPath(app.raw.TypeName, applicationName.Id, serviceName.Id),
        loading: 'loaded',
      };

    } catch {
      this.messageService.showMessage('There was an issue getting partition info', MessageSeverity.Err);
      this.partitions[id] = {
        ...check,
        loading: 'failed',
      };
    }

    this.partitionDataChanges.next(id);

    return this.partitions[id];
  }
}
