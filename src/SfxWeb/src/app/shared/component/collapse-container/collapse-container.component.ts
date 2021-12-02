import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-collapse-container',
  templateUrl: './collapse-container.component.html',
  styleUrls: ['./collapse-container.component.scss']
})
export class CollapseContainerComponent {

  @Input() collapsed = false;
  @Input() disabled = false;
  @Input() hideTooltip = false;
  @Input() sectionName = 'this';
  @Input() buttonClass = '';
  @Output() collapsedChange = new EventEmitter<boolean>();

  changeCollapseState() {
    if (!this.disabled) {
      this.collapsed = !this.collapsed;
      this.collapsedChange.emit(this.collapsed);
    }
  }
}
