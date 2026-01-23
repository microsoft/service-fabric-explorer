// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, Injector } from '@angular/core';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { NodeCollection } from 'src/app/Models/DataModels/collections/NodeCollection';
import { DataService } from 'src/app/services/data.service';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';

@Component({
  selector: 'app-clustermap',
  templateUrl: './clustermap.component.html',
  styleUrls: ['./clustermap.component.scss']
})
export class ClustermapComponent extends BaseControllerDirective {
  nodes: NodeCollection;
  filteredNodes = [];

  groupByNodeType = false;

  constructor(injector: Injector, private dataService: DataService) {
    super(injector);
   }

   setup() {
     this.nodes = this.dataService.nodes;
   }

   refresh(messageHandler: IResponseMessageHandler) {
    return this.nodes.refresh(messageHandler);
   }

   setNodes(nodes: Node[]) {
    this.filteredNodes = nodes;
   }
}
