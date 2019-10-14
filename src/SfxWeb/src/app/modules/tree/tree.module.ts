import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreeViewComponent } from './tree-view/tree-view.component';
import { TreeNodeComponent } from './tree-node/tree-node.component';



@NgModule({
  declarations: [TreeViewComponent, TreeNodeComponent],
  imports: [
    CommonModule
  ],
  exports: [TreeViewComponent, TreeNodeComponent]
})
export class TreeModule { }
