import { Component, Injector, OnInit } from '@angular/core';
import { Constants } from 'src/app/Common/Constants';
import { DataService } from 'src/app/services/data.service';
import { TreeService } from 'src/app/services/tree.service';
import { ITab } from 'src/app/shared/component/navbar/navbar.component';
import { IdGenerator } from 'src/app/Utils/IdGenerator';
import { NodeBaseControllerDirective } from '../../node/NodeBase';
import { NodeTypeBaseControllerDirective } from '../NodeTypeBase';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss']
})
export class BaseComponent extends NodeTypeBaseControllerDirective {

  tabs: ITab[] = [{
    name: 'node type',
    route: './'
    }
  ];
  constructor(protected data: DataService, injector: Injector, private tree: TreeService) {
    super(data, injector);

    this.data.clusterManifest.ensureInitialized().subscribe(() => {
      if (this.data.clusterManifest.isEventStoreEnabled &&
        this.tabs.indexOf(Constants.EventsTab) === -1) {
          this.tabs = this.tabs.concat(Constants.EventsTab);
        }
    });
  }

  setup() {
    this.tree.selectTreeNode([
      IdGenerator.cluster(),
      IdGenerator.nodeGroup(),
      IdGenerator.node(this.nodeType)
    ]);
  }
}