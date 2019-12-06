import { Component, OnInit, Input } from '@angular/core';
import { TreeNodeGroupViewModel } from 'src/app/ViewModels/TreeNodeGroupViewModel';

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

}
