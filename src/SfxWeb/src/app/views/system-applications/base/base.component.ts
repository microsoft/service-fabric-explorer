import { Component, OnInit, Injector } from '@angular/core';
import { ITab } from 'src/app/shared/component/navbar/navbar.component';
import { ServiceApplicationsBaseControllerDirective } from '../SystemApplicationBase';
import { IdGenerator } from 'src/app/Utils/IdGenerator';
import { DataService } from 'src/app/services/data.service';
import { TreeService } from 'src/app/services/tree.service';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss']
})
export class BaseComponent extends ServiceApplicationsBaseControllerDirective {
  tabs: ITab[] = [{
    name: 'essentials',
    route: './'
    }
  ];
  constructor(protected data: DataService, injector: Injector, private tree: TreeService) {
    super(data, injector);
  }

  setup() {
    this.tree.selectTreeNode([
      IdGenerator.cluster(),
      IdGenerator.systemAppGroup()
    ], true);
  }
}
