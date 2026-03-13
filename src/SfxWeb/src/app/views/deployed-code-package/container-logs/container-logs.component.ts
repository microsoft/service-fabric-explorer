// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, Injector } from '@angular/core';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
import { DeployedCodePackageBaseControllerDirective } from '../DeployedCodePackageBase';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-container-logs',
  templateUrl: './container-logs.component.html',
  styleUrls: ['./container-logs.component.scss']
})
export class ContainerLogsComponent extends DeployedCodePackageBaseControllerDirective {
  containerLogs: string;

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }


  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    return this.deployedCodePackage.containerLogs.refresh(messageHandler).pipe(map(containerLogs => {
      this.containerLogs = containerLogs.raw.Content;
    }));
  }

  getLogs() {
    this.refresh().subscribe();
  }
}
