// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, Injector } from '@angular/core';
import { DeployedServicePackageBaseControllerDirective } from '../DeployedServicePackage';
import { DataService } from 'src/app/services/data.service';
import { IEssentialListItem } from 'src/app/modules/charts/essential-health-tile/essential-health-tile.component';
import { of } from 'rxjs';

@Component({
  selector: 'app-essentials',
  templateUrl: './essentials.component.html',
  styleUrls: ['./essentials.component.scss']
})
export class EssentialsComponent extends DeployedServicePackageBaseControllerDirective {
  essentialItems: IEssentialListItem[] = [];

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  setup() {
    this.essentialItems = [];
  }

  refresh() {
    this.essentialItems = [
      {
        descriptionName: 'Version',
        displayText: this.servicePackage.raw.Version,
        copyTextValue: this.servicePackage.raw.Version
      },
      {
        descriptionName: 'Status',
        copyTextValue: this.servicePackage.raw.Status,
        selectorName: 'status',
        displaySelector: true
      }
    ];

    if (this.servicePackage.servicePackageActivationId) {
      this.essentialItems.push({
          descriptionName: 'Service Package Activation Id',
          copyTextValue: this.servicePackage.servicePackageActivationId,
          selectorName: 'appTypeViewPath',
          displaySelector: true
        });
    }

    return of(null);
  }
}
