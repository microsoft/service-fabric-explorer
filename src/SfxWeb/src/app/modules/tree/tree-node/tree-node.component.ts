import { Component, Input } from '@angular/core';
import { TreeNodeGroupViewModel } from 'src/app/ViewModels/TreeNodeGroupViewModel';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-tree-node',
  templateUrl: './tree-node.component.html',
  styleUrls: ['./tree-node.component.scss']
})
export class TreeNodeComponent {
  @Input() node: TreeNodeGroupViewModel;

  public assetBase = environment.assetBase;
  higherZIndex = -1;

  constructor() { }

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
}
