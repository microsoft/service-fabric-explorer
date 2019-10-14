import { Component, OnInit } from '@angular/core';
import { TreeService } from 'src/app/services/tree.service';

@Component({
  selector: 'app-tree-view',
  templateUrl: './tree-view.component.html',
  styleUrls: ['./tree-view.component.scss']
})
export class TreeViewComponent implements OnInit {

  constructor(public treeService: TreeService) { }

  ngOnInit() {
    console.log(this.treeService.tree)
    // this.treeService.tree.childGroupViewModel
  }

}
