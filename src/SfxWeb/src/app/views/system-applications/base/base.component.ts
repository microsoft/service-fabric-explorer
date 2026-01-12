// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, OnInit, Injector, ElementRef } from '@angular/core';
import { ITab } from 'src/app/shared/component/navbar/navbar.component';
import { ServiceApplicationsBaseControllerDirective } from '../SystemApplicationBase';
import { IdGenerator } from 'src/app/Utils/IdGenerator';
import { DataService } from 'src/app/services/data.service';
import { TreeService } from 'src/app/services/tree.service';
import { IBaseView } from '../../BaseView';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss']
})
export class BaseComponent extends ServiceApplicationsBaseControllerDirective implements IBaseView{
  tabs: ITab[] = [{
    name: 'essentials',
    route: './'
    }
  ];
  constructor(protected data: DataService, injector: Injector, private tree: TreeService, public el: ElementRef) {
    super(data, injector);
  }

  setup() {
    this.tree.selectTreeNode([
      IdGenerator.cluster(),
      IdGenerator.systemAppGroup()
    ], true);
  }
}
