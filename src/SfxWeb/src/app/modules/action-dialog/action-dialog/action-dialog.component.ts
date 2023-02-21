import { Component, Inject, ViewChild, AfterViewInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IModalData } from 'src/app/ViewModels/Modal';
import { ActionDialogTemplateComponent } from '../action-dialog-template/action-dialog-template.component';
import { DialogBodyDirective } from '../dialog-body.directive';
import { DialogBodyComponent } from '../DialogBodyComponent';

@Component({
  selector: 'app-action-dialog',
  templateUrl: './action-dialog.component.html',
  styleUrls: ['./action-dialog.component.scss']
})
export class ActionDialogComponent implements AfterViewInit {

  @ViewChild(DialogBodyDirective) body: DialogBodyDirective;
  disableSubmit = false;

  constructor(public dialogRef: MatDialogRef<ActionDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: IModalData) { }

  ngAfterViewInit() {
    let modalBody: DialogBodyComponent;
    if (!this.data.bodyTemplate) {
      modalBody = this.body.viewContainerRef.createComponent(ActionDialogTemplateComponent).instance;
      modalBody.inputs = { message: this.data.modalMessage, confirmationKeyword: this.data.confirmationKeyword }; 
    }
    else {
      modalBody = this.body.viewContainerRef.createComponent(this.data.bodyTemplate).instance;
      modalBody.inputs = this.data.bodyInputs;    
    }

    if (modalBody.disableSubmit) {
      modalBody.disableSubmit.subscribe((value) => this.setSumbitDisable(value));
    }
  }

  ok(){
    this.dialogRef.close(true);
  }

  cancel() {
    this.dialogRef.close(false);
  }

  setSumbitDisable(value: boolean) {
    this.disableSubmit = value;
  }
}
