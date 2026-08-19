import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, Input, Output, EventEmitter, OnChanges, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-collapse-container',
    templateUrl: './collapse-container.component.html',
    styleUrls: ['./collapse-container.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CollapseContainerComponent implements OnChanges, OnInit{
  private liveAnnouncer = inject(LiveAnnouncer);


  @Input() collapsed = false;
  @Input() disabled = false;
  @Input() sectionName = 'this';
  @Output() collapsedChange = new EventEmitter<boolean>();

  displayText = '';

  ngOnChanges() {
    this.setText();
  }

  ngOnInit() {
    this.setText();
  }

  changeCollapseState() {

    if (!this.disabled) {
      this.liveAnnouncer.announce(`${this.sectionName} Section has been ${this.collapsed ? 'Opened' : 'Closed'}`);
      this.collapsed = !this.collapsed;
      this.collapsedChange.emit(this.collapsed);
    }
    this.setText();

  }

  setText() {
    this.displayText = (this.collapsed ? 'Open ' : 'Close ')  + this.sectionName + ' Section';
  }
}
