import { Component, Injector } from '@angular/core';
import { ITab } from 'src/app/shared/component/navbar/navbar.component';
import { TreeService } from 'src/app/services/tree.service';
import { IdGenerator } from 'src/app/Utils/IdGenerator';
import { ApplicationTypeBaseControllerDirective } from '../ApplicationTypeBase';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss']
})
export class BaseComponent extends ApplicationTypeBaseControllerDirective {

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

  constructor(protected data: DataService, injector: Injector, private tree: TreeService) {
    super(data, injector);
  }

  setup() {
    this.tree.selectTreeNode([
      IdGenerator.cluster(),
      IdGenerator.appGroup(),
      IdGenerator.appType(this.appTypeName),
    ], true);
  }
}
