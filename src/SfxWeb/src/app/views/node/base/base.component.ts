import { Component, ElementRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { ITab } from 'src/app/shared/component/navbar/navbar.component';
import { TreeService } from 'src/app/services/tree.service';
import { IdGenerator } from 'src/app/Utils/IdGenerator';
import { NodeBaseControllerDirective } from '../NodeBase';
import { DataService } from 'src/app/services/data.service';
import { Constants } from 'src/app/Common/Constants';
import { IBaseView } from '../../BaseView';

@Component({
    selector: 'app-base',
    templateUrl: './base.component.html',
    styleUrls: ['./base.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class BaseComponent extends NodeBaseControllerDirective implements IBaseView {
  protected data = inject(DataService);
  private tree = inject(TreeService);
  el = inject(ElementRef);


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

  constructor() {
    super();

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
      IdGenerator.node(this.nodeName)
    ]);
  }
}
