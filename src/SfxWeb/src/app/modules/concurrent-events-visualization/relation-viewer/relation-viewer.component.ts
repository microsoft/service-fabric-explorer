import { Component, Input, OnChanges, OnInit } from '@angular/core';

@Component({
  selector: 'app-relation-viewer',
  templateUrl: './relation-viewer.component.html',
  styleUrls: ['./relation-viewer.component.scss']
})
export class RelationViewerComponent implements OnChanges {

  @Input() key: string;

  split: string[];
  constructor() { }

  ngOnChanges(): void {
    this.split = this.key.split("=>");
  }
}
