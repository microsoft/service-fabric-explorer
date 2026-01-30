// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, OnInit, Injector } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { DeployedReplicaBaseControllerDirective } from '../DeployedReplicaBase';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable, of } from 'rxjs';
import { RoutesService } from 'src/app/services/routes.service';
import { IEssentialListItem } from 'src/app/modules/charts/essential-health-tile/essential-health-tile.component';

@Component({
  selector: 'app-essentials',
  templateUrl: './essentials.component.html',
  styleUrls: ['./essentials.component.scss']
})
export class EssentialsComponent extends DeployedReplicaBaseControllerDirective {
  appView: string;

  essentialItems: IEssentialListItem[] = [];
  essentialItems2: IEssentialListItem[] = [];

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  setup() {
    this.essentialItems = [];
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    const deployedService = this.replica.parent;
    const deployedApplication = deployedService.parent;
    const serviceName = encodeURI(this.replica.raw.ServiceName.replace('fabric:/', ''));
    this.appView = RoutesService.getReplicaViewPath(deployedApplication.raw.TypeName, deployedApplication.raw.Id, serviceName,
      this.replica.raw.PartitionId, this.replica.id);

    this.essentialItems = [
      {
        descriptionName: 'Status',
        copyTextValue: this.replica.raw.ReplicaStatus,
        selectorName: 'status',
        displaySelector: true
      },
      {
        selectorName: 'view',
        displaySelector: true
      },
    ];

    if (this.replica.detail.isInitialized) {
      this.essentialItems.splice(1, 0,
        {
          descriptionName: 'Process Id',
          copyTextValue: this.replica.detail.processID,
          displayText: this.replica.detail.processID
        });
    }

    if (this.replica.servicePackageActivationId) {
      this.essentialItems.splice(1, 0,{
        descriptionName: 'Service Package Activation Id',
        copyTextValue: this.replica.servicePackageActivationId,
        displayText: this.replica.servicePackageActivationId
      });
    }

    this.essentialItems2 = [
      {
        descriptionName: 'Service Name',
        copyTextValue: this.replica.raw.ServiceName,
        selectorName: 'serviceName',
        displaySelector: true
      },
      {
        descriptionName: 'Service Kind',
        displayText: this.replica.raw.ServiceKind,
        copyTextValue: this.replica.raw.ServiceKind
      },
      {
        descriptionName: 'Partition Id',
        displayText: this.replica.raw.PartitionId,
        copyTextValue: this.replica.raw.PartitionId
      }
    ];

    if (this.replica.isStatefulService) {
      this.essentialItems2.push({
        descriptionName: 'Replica Role',
        copyTextValue: this.replica.role,
        displayText: this.replica.role
      });
    }
    return of(null);
  }
}
