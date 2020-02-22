import { Component, OnInit, Input } from '@angular/core';
import { TreeNodeGroupViewModel } from 'src/app/ViewModels/TreeNodeGroupViewModel';
import { TreeNodeViewModel } from 'src/app/ViewModels/TreeNodeViewModel';

@Component({
  selector: 'app-tree-node',
  templateUrl: './tree-node.component.html',
  styleUrls: ['./tree-node.component.scss']
})
export class TreeNodeComponent implements OnInit {
 
  @Input() node: TreeNodeGroupViewModel;

  constructor() { }

  ngOnInit() {

  }

  trackById(index: number, node: TreeNodeViewModel) {
    return node.nodeId
  }
}
