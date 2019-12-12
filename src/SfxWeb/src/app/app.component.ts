import { Component, OnInit } from '@angular/core';
import { TreeService } from './services/tree.service';
import { RefreshService } from './services/refresh.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{

  treeWidth: string = "450px";

  constructor(public treeService: TreeService,
              private refreshService: RefreshService) {

  }

  ngOnInit() {
    this.treeService.init();
    this.refreshService.init()
  }
  
  resize($event: number): void {
    console.log($event)
    //have to subtract the offset
    this.treeWidth = ($event + 5).toString() + 'px';
  }
}
