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
  modalBody: DialogBodyComponent;

  constructor(public dialogRef: MatDialogRef<ActionDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: IModalData) { }

  ngAfterViewInit() {
    if (!this.data.modalBody?.template) {
      this.modalBody = this.body.viewContainerRef.createComponent(ActionDialogTemplateComponent).instance;
      this.modalBody.inputs = this.data.modalBody.inputs;  
    }
    else {
      this.modalBody = this.body.viewContainerRef.createComponent(this.data.modalBody.template).instance;
      this.modalBody.inputs = this.data.modalBody.inputs;    
    }

    if (this.modalBody.disableSubmit) {
      this.modalBody.disableSubmit.subscribe((value) => this.setSumbitDisable(value));
    }
  }

  ok() {
    if (this.modalBody.ok) {
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
