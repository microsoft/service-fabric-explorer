import { Component, OnInit, Injector } from '@angular/core';
import { ITab } from 'src/app/shared/component/navbar/navbar.component';
import { ApplicationBaseControllerDirective } from '../applicationBase';
import { DataService } from 'src/app/services/data.service';
import { TreeService } from 'src/app/services/tree.service';
import { IdGenerator } from 'src/app/Utils/IdGenerator';
import { Constants } from 'src/app/Common/Constants';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss']
})
export class BaseComponent extends ApplicationBaseControllerDirective {

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
      if (this.data.clusterManifest.isBackupRestoreEnabled &&
        !this.tabs.some(tab => tab.name === 'backup')) {
        this.tabs.push({
          name: 'backup',
          route: './backup'
        });
      }

      if (this.data.clusterManifest.isEventStoreEnabled &&
        !this.tabs.some(tab => tab.name === Constants.EventsTab.name)) {
        this.tabs.push(Constants.EventsTab);
      }
    });
  }

}
