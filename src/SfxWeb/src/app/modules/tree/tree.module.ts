import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreeViewComponent } from './tree-view/tree-view.component';
import { TreeNodeComponent } from './tree-node/tree-node.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { SeletedNodeDirective } from './selected-node.directive';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
@NgModule({
  declarations: [TreeViewComponent, TreeNodeComponent, SeletedNodeDirective],
  imports: [
    NgbDropdownModule,
    CommonModule,
    SharedModule
  ],
  exports: [TreeViewComponent, TreeNodeComponent]
})
export class TreeModule { }
