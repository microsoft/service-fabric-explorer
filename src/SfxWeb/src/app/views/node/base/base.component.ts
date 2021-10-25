import { Component, Injector } from '@angular/core';
import { ITab } from 'src/app/shared/component/navbar/navbar.component';
import { TreeService } from 'src/app/services/tree.service';
import { IdGenerator } from 'src/app/Utils/IdGenerator';
import { NodeBaseControllerDirective } from '../NodeBase';
import { DataService } from 'src/app/services/data.service';
import { Constants } from 'src/app/Common/Constants';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss']
})
export class BaseComponent extends NodeBaseControllerDirective {

  tabs: ITab[] = [{
    name: 'essentials',
    route: './'
  },
  {
    name: 'details',
    route: './details'
  }
  ];

  constructor(protected data: DataService, injector: Injector, private tree: TreeService) {
    super(data, injector);

    this.data.clusterManifest.ensureInitialized().subscribe(() => {
      if (this.data.clusterManifest.isEventStoreEnabled &&
        this.tabs.indexOf(Constants.EventsTab) === -1) {
        this.tabs.push(Constants.EventsTab);
      }
    });
  }

  setup() {
    this.tree.selectTreeNode([
      IdGenerator.cluster(),
      IdGenerator.nodeGroup(),
      IdGenerator.node(this.nodeName)
    ]);
  }
}
