import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-check-box',
    templateUrl: './check-box.component.html',
    styleUrls: ['./check-box.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CheckBoxComponent  {

  @Input() state = false;
  @Output() stateChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor() { }

  changeState() {
    this.state = !this.state;
    this.stateChange.emit(this.state);
  }

}
