import { Component, ViewChild, AfterViewInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IModalData } from 'src/app/ViewModels/Modal';
import { MessageWithConfirmationComponent } from '../message-with-confirmation/message-with-confirmation.component';
import { DialogBodyDirective } from '../dialog-body.directive';
import { DialogBodyComponent } from '../DialogBodyComponent';
import { ActionDialogUtils } from '../utils';

@Component({
    selector: 'app-action-dialog',
    templateUrl: './action-dialog.component.html',
    styleUrls: ['./action-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ActionDialogComponent implements AfterViewInit {
  dialogRef = inject<MatDialogRef<ActionDialogComponent>>(MatDialogRef);
  data = inject<IModalData>(MAT_DIALOG_DATA);


  @ViewChild(DialogBodyDirective) body: DialogBodyDirective;
  disableSubmit = false;
  modalBody: DialogBodyComponent;

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
