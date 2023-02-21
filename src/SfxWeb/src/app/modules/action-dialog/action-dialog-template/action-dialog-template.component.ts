import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DialogBodyComponent } from '../DialogBodyComponent';

@Component({
  selector: 'app-action-dialog-template',
  templateUrl: './action-dialog-template.component.html',
  styleUrls: ['./action-dialog-template.component.scss']
})
export class ActionDialogTemplateComponent implements OnInit, DialogBodyComponent {

  @Input() inputs: {message?: string, confirmationKeyword?: string};
  @Output() disableSubmit = new EventEmitter<boolean>();
 
  userInput = '';
  placeHolderText = '';

  ngOnInit() {
    this.placeHolderText = `Type in ${this.inputs.confirmationKeyword} to continue`;
    this.userInputChange(this.userInput);
  }

  userInputChange(value) {
    if (this.inputs.confirmationKeyword !== value.trim()) {
      this.disableSubmit.emit(true);
    }
    else {
      this.disableSubmit.emit(false);
    }
  }
 
}
