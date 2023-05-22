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
