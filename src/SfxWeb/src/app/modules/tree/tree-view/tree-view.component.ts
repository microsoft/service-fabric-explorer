import { Component, OnInit, ViewChild, ElementRef, OnChanges, AfterViewInit, Output, EventEmitter, DoCheck, Input } from '@angular/core';
import { TreeService } from 'src/app/services/tree.service';
import { environment } from 'src/environments/environment';
import { LiveAnnouncer } from '@angular/cdk/a11y';

@Component({
  selector: 'app-tree-view',
  templateUrl: './tree-view.component.html',
  styleUrls: ['./tree-view.component.scss']
})
export class TreeViewComponent implements DoCheck {

  @Input() smallWindowSize: boolean = false;
  @Output() onTreeSize = new EventEmitter<number>();

  public showBeta = environment.showBeta;
  public canExpand = false;
  @ViewChild("tree") tree: ElementRef;
  constructor(public treeService: TreeService, private liveAnnouncer: LiveAnnouncer) { }

  ngDoCheck(): void {
    if(this.tree) {
      this.canExpand = this.tree.nativeElement.scrollWidth > this.tree.nativeElement.clientWidth;
    }
  }

  leaveBeta() {
    const originalUrl = location.origin + '/Explorer/index.html' + location.hash;
    window.location.assign(originalUrl);

  }

  setWidth() {
    this.onTreeSize.emit(this.tree.nativeElement.scrollWidth + 20)
  }

  setSearchText(text: string) {
    this.treeService.tree.searchTerm = text;
    this.liveAnnouncer.announce(`${this.treeService.tree.childGroupViewModel.owningNode.filtered} search results`);
  }
}
