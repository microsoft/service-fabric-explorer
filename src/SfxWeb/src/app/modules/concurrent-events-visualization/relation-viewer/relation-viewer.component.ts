import { Component, Input, OnChanges, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-relation-viewer',
    templateUrl: './relation-viewer.component.html',
    styleUrls: ['./relation-viewer.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class RelationViewerComponent implements OnChanges {

  @Input() key: string;

  split: string[];
  constructor() { }

  ngOnChanges(): void {
    this.split = this.key.split("=>");
  }
}
