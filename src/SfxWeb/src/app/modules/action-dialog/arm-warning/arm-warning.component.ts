import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-arm-warning',
  templateUrl: './arm-warning.component.html',
  styleUrls: ['./arm-warning.component.scss']
})
export class ArmWarningComponent {

  @Input() inputs: { resourceId: string, message?: string, confirmationKeyword?: string };
  @Output() disableSubmit = new EventEmitter<boolean>();
  constructor() { }

  emitEvent(value) {
    this.disableSubmit.emit(value);
  }

}
