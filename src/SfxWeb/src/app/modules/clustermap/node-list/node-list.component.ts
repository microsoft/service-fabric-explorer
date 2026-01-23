// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, Input, TemplateRef } from '@angular/core';
import { Node } from 'src/app/Models/DataModels/Node';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-node-list',
  templateUrl: './node-list.component.html',
  styleUrls: ['./node-list.component.scss']
})
export class NodeListComponent {
  @Input() listTemplate: TemplateRef<any>;

  @Input() underlineLast = true;
  @Input() nodes: Node[];

  public assetBase = environment.assetBase;

  constructor() { }

  trackByFn(index, node: Node) {
    return node.uniqueId;
  }
}
