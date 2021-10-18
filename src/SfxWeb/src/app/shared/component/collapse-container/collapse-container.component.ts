import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';

@Component({
  selector: 'app-collapse-container',
  templateUrl: './collapse-container.component.html',
  styleUrls: ['./collapse-container.component.scss']
})
export class CollapseContainerComponent implements OnChanges{

  @Input() collapsed = false;
  @Input() disabled = false;
  @Input() hideTooltip = false;
  @Input() sectionName = 'this';
  @Input() tooltipSouth = false;
  @Output() collapsedChange = new EventEmitter<boolean>();

  displayText = "";

  constructor(private liveAnnouncer: LiveAnnouncer) {}

  ngOnChanges() {
    this.setText();
  }

  changeCollapseState() {
    if (!this.disabled) {
      this.liveAnnouncer.announce(this.collapsed ? 'Opened': 'Closed'  + this.sectionName + ' Section');
      this.collapsed = !this.collapsed;
      this.collapsedChange.emit(this.collapsed);
      this.setText();
    }
  }

  setText() {
    this.displayText = this.collapsed ? 'Open ': 'Close '  + this.sectionName + ' Section';
  }

}
