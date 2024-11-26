import { Component, Inject, ViewChild, AfterViewInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IModalData } from 'src/app/ViewModels/Modal';
import { MessageWithConfirmationComponent } from '../message-with-confirmation/message-with-confirmation.component';
import { DialogBodyDirective } from '../dialog-body.directive';
import { DialogBodyComponent } from '../DialogBodyComponent';
import { ActionDialogUtils } from '../utils';

@Component({
  selector: 'app-action-dialog',
  templateUrl: './action-dialog.component.html',
  styleUrls: ['./action-dialog.component.scss']
})
export class ActionDialogComponent implements AfterViewInit {

  @ViewChild(DialogBodyDirective) body: DialogBodyDirective;
  disableSubmit = false;
  modalBody: DialogBodyComponent;

  constructor(public dialogRef: MatDialogRef<ActionDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: IModalData) { }

  ngAfterViewInit() {
    if (!this.data.modalBody?.template) {
      this.modalBody = ActionDialogUtils.createChildComponent(this.body, this.data.modalBody.inputs, MessageWithConfirmationComponent, (value) => { this.setSumbitDisable(value) });
    }
    else {
      this.modalBody = ActionDialogUtils.createChildComponent(this.body, this.data.modalBody.inputs, this.data.modalBody.template, (value) => { this.setSumbitDisable(value) });
    }
  }

  ok() {
    if (this.modalBody?.ok) {
      this.modalBody.ok().subscribe((value) => {
        if (value) {
          this.dialogRef.close(true);
        }
      });
    }
    else {
      this.dialogRef.close(true);
    }
  }

  cancel() {
    this.dialogRef.close(false);
  }

  setSumbitDisable(value: boolean) {
    this.disableSubmit = value;
  }
}
