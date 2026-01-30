// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PaginationId, TreeNodeGroupViewModel } from 'src/app/ViewModels/TreeNodeGroupViewModel';
import { TreeService } from 'src/app/services/tree.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-tree-node',
  templateUrl: './tree-node.component.html',
  styleUrls: ['./tree-node.component.scss']
})
export class TreeNodeComponent {
  @Input() node: TreeNodeGroupViewModel;
  @Output() focusEmitter = new EventEmitter<boolean>();

  paginationId = PaginationId;

  public assetBase = environment.assetBase;
  higherZIndex = -1;

  constructor(public treeService: TreeService) { }
  
  trackById(index: number, node: TreeNodeGroupViewModel) {
    return node.nodeId;
  }

  changeZIndez(index: number, state: boolean) {
    if(state) {
      this.higherZIndex = index;
    }else if(index === this.higherZIndex && !state){
      this.higherZIndex = -1;
    }
  }

  public emitFocus(focusState: boolean) {
    this.focusEmitter.emit(focusState);
  }

}
