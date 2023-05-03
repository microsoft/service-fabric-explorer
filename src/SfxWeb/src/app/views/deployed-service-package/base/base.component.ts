import { Component, ElementRef, Injector } from '@angular/core';
import { ITab } from 'src/app/shared/component/navbar/navbar.component';
import { DataService } from 'src/app/services/data.service';
import { TreeService } from 'src/app/services/tree.service';
import { IdGenerator } from 'src/app/Utils/IdGenerator';
import { DeployedServicePackageBaseControllerDirective } from '../DeployedServicePackage';
import { IBaseView } from '../../BaseView';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss']
})
export class BaseComponent extends DeployedServicePackageBaseControllerDirective implements IBaseView {

  tabs: ITab[] = [{
    name: 'essentials',
    route: './'
    },
    {
      name: 'details',
      route: './details'
    },
    {
        name: 'manifest',
        route: './manifest'
    },
    {
      name: 'commands',
      route: './commands'
    }
  ];

  constructor(protected data: DataService, injector: Injector, private tree: TreeService, public el: ElementRef) {
    super(data, injector);
  }

  setup() {
    this.tree.selectTreeNode([
      IdGenerator.cluster(),
      IdGenerator.nodeGroup(),
      IdGenerator.node(this.nodeName),
      IdGenerator.deployedApp(this.appId),
      IdGenerator.deployedServicePackage(this.serviceId, this.activationId)
    ], true);
  }
}
