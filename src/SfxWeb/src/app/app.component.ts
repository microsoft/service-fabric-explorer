import { Component, OnInit } from '@angular/core';
import { TreeService } from './services/tree.service';
import { IdGenerator } from './Utils/IdGenerator';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{

  constructor(public treeService: TreeService) {

  }

  ngOnInit() {
    this.treeService.init();

    // this.treeService.selectTreeNode([                IdGenerator.cluster(),
    //   IdGenerator.appGroup()]).subscribe( ()=> {
    //   console.log(this.treeService.tree)
    // })
  }
  
}
