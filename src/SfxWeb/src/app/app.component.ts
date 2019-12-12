import { Component, OnInit } from '@angular/core';
import { TreeService } from './services/tree.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{

  treeWidth: string = "450px";

  constructor(public treeService: TreeService) {

  }

  ngOnInit() {
    this.treeService.init();

  }
  
  resize($event: number): void {
    console.log($event)
    //have to subtract the offset
    this.treeWidth = ($event + 5).toString() + 'px';
  }
}
