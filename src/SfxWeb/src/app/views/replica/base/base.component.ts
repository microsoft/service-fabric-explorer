// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, ElementRef, Injector } from '@angular/core';
import { ITab } from 'src/app/shared/component/navbar/navbar.component';
import { ReplicaBaseControllerDirective } from '../ReplicaBase';
import { DataService } from 'src/app/services/data.service';
import { TreeService } from 'src/app/services/tree.service';
import { IdGenerator } from 'src/app/Utils/IdGenerator';
import { Constants } from 'src/app/Common/Constants';
import { IBaseView } from '../../BaseView';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss']
})
export class BaseComponent extends ReplicaBaseControllerDirective implements IBaseView {

  tabs: ITab[] = [{
    name: 'essentials',
    route: './'
    },
    {
      name: 'details',
      route: './details'
    },
    {
      name: 'commands',
      route: './commands'
    }
  ];

  constructor(protected dataService: DataService, injector: Injector, private tree: TreeService, public el: ElementRef) {
    super(dataService, injector);
  }

  setup() {
    this.dataService.clusterManifest.ensureInitialized().subscribe(() => {
      if (this.data.clusterManifest.isEventStoreEnabled &&
        this.tabs.indexOf(Constants.EventsTab) === -1) {
          this.tabs = this.tabs.concat(Constants.EventsTab);
        }
    });

    this.isSystem = this.appTypeName === Constants.SystemAppTypeName;
    if (this.isSystem) {
        this.tree.selectTreeNode([
            IdGenerator.cluster(),
            IdGenerator.systemAppGroup(),
            IdGenerator.service(this.serviceId),
            IdGenerator.partition(this.partitionId),
            IdGenerator.replica(this.replicaId)
        ]);
    } else {
        this.tree.selectTreeNode([
            IdGenerator.cluster(),
            IdGenerator.appGroup(),
            IdGenerator.appType(this.appTypeName),
            IdGenerator.app(this.appId),
            IdGenerator.service(this.serviceId),
            IdGenerator.partition(this.partitionId),
            IdGenerator.replica(this.replicaId)
        ]);
    }
  }
}
