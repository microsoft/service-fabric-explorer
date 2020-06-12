import { Component, OnInit, ViewChild, ElementRef, OnChanges, AfterViewInit, Output, EventEmitter, DoCheck } from '@angular/core';
import { TreeService } from 'src/app/services/tree.service';

@Component({
  selector: 'app-tree-view',
  templateUrl: './tree-view.component.html',
  styleUrls: ['./tree-view.component.scss']
})
export class TreeViewComponent implements DoCheck {

  @Output() onTreeSize = new EventEmitter<number>();

  public canExpand = false;
  @ViewChild("tree") tree: ElementRef;
  constructor(public treeService: TreeService) { }

  ngDoCheck(): void {
    if(this.tree) {
      this.canExpand = this.tree.nativeElement.scrollWidth > this.tree.nativeElement.clientWidth;
    }
  }

  leaveBeta() {
    const originalUrl =  location.href.replace('beta.html', 'index.html');
    window.location.assign(originalUrl);
  }

  setWidth() {
    this.onTreeSize.emit(this.tree.nativeElement.scrollWidth + 20)
  }
}
