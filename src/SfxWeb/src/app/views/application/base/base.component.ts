import { Component, OnInit, Injector } from '@angular/core';
import { ITab } from 'src/app/shared/component/navbar/navbar.component';
import { ApplicationBaseController } from '../applicationBase';
import { DataService } from 'src/app/services/data.service';
import { TreeService } from 'src/app/services/tree.service';
import { IdGenerator } from 'src/app/Utils/IdGenerator';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss']
})
export class BaseComponent extends ApplicationBaseController {

  tabs: ITab[] = [{
    name: 'essentials',
    route: './'
    },
    {
      name: 'details',
      route: './details'
    },
    {
      name: 'deployments',
      route: './deployments'
    },
    {
      name: 'manifest',
      route: './manifest'
    },
    {
      name: 'events',
      route: './events'
    }
  ];

  constructor(protected data: DataService, injector: Injector, private tree: TreeService) {
    super(data, injector);
  }

  setup() {
    this.tree.selectTreeNode([
      IdGenerator.cluster(),
      IdGenerator.appGroup(),
      IdGenerator.appType(this.appTypeName),
      IdGenerator.app(this.appId)
    ]);

    this.data.clusterManifest.ensureInitialized().subscribe(() => {
      if (this.data.clusterManifest.isBackupRestoreEnabled) {
        if (!this.tabs.some(tab => tab.name === 'backup')) {
          this.tabs.push({
            name: 'backup',
            route: './backup'
          });
        }
      }
    });
  }

}
