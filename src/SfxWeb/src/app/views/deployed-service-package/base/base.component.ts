import { Component, ElementRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { ITab } from 'src/app/shared/component/navbar/navbar.component';
import { DataService } from 'src/app/services/data.service';
import { TreeService } from 'src/app/services/tree.service';
import { IdGenerator } from 'src/app/Utils/IdGenerator';
import { DeployedServicePackageBaseControllerDirective } from '../DeployedServicePackage';
import { IBaseView } from '../../BaseView';

@Component({
    selector: 'app-base',
    templateUrl: './base.component.html',
    styleUrls: ['./base.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class BaseComponent extends DeployedServicePackageBaseControllerDirective implements IBaseView {
  protected data: DataService = inject(DataService);
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
        name: 'manifest',
        route: './manifest'
    },
    {
      name: 'commands',
      route: './commands'
    }
  ];

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
