// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreeViewComponent } from './tree-view/tree-view.component';
import { TreeNodeComponent } from './tree-node/tree-node.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { SeletedNodeDirective } from './selected-node.directive';
@NgModule({
  declarations: [TreeViewComponent, TreeNodeComponent, SeletedNodeDirective],
  imports: [
    CommonModule,
    SharedModule
  ],
  exports: [TreeViewComponent, TreeNodeComponent]
})
export class TreeModule { }
