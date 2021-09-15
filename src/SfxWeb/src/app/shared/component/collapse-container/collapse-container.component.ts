import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';

@Component({
  selector: 'app-collapse-container',
  templateUrl: './collapse-container.component.html',
  styleUrls: ['./collapse-container.component.scss']
})
export class CollapseContainerComponent implements OnChanges {

  @Input() collapsed = false;
  @Input() disabled = false;
  @Input() hideTooltip = false;
  @Input() sectionName = 'this';
  @Output() collapsedChange = new EventEmitter<boolean>();

  changeCollapseState() {
    if (!this.disabled) {
      this.collapsed = !this.collapsed;
      this.collapsedChange.emit(this.collapsed);
      console.log(this.collapsed)
    }
  }

  ngOnChanges() {
    console.log(this)
  }
}
