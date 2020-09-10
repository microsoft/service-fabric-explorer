import { Component, Input } from '@angular/core';
import { TreeNodeGroupViewModel } from 'src/app/ViewModels/TreeNodeGroupViewModel';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-tree-node',
  templateUrl: './tree-node.component.html',
  styleUrls: ['./tree-node.component.scss']
})
export class TreeNodeComponent {
  public assetBase = environment.assetBase;

  @Input() node: TreeNodeGroupViewModel;

  constructor() { }

  trackById(index: number, node: TreeNodeGroupViewModel) {
    return node.nodeId;
  }
}
