import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DialogBodyComponent } from '../DialogBodyComponent';

@Component({
  selector: 'app-message-with-confirmation',
  templateUrl: './message-with-confirmation.component.html',
  styleUrls: ['./message-with-confirmation.component.scss']
})
export class MessageWithConfirmation implements OnInit, DialogBodyComponent {

  @Input() inputs: {message?: string, confirmationKeyword?: string};
  @Output() disableSubmit = new EventEmitter<boolean>();
 
  userInput = '';
  placeHolderText = '';

  ngOnInit() {
    this.placeHolderText = `Type in ${this.inputs.confirmationKeyword} to continue`;
    this.userInputChange(this.userInput);
  }

  userInputChange(value) {
    if (this.inputs.confirmationKeyword && this.inputs.confirmationKeyword !== value.trim()) {
      this.disableSubmit.emit(true);
    }
    else {
      this.disableSubmit.emit(false);
    }
  }
 
}
