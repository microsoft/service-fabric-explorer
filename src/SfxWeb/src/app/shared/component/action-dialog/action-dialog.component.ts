import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IModalData, IModalDataAdditionalParameter } from 'src/app/ViewModels/Modal';

@Component({
  selector: 'app-action-dialog',
  templateUrl: './action-dialog.component.html',
  styleUrls: ['./action-dialog.component.scss']
})
export class ActionDialogComponent implements OnInit {

  userInput = '';
  placeHolderText = '';
  additionalParam: IModalDataAdditionalParameter = null;
  constructor(public dialogRef: MatDialogRef<ActionDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: IModalData) { }

  ngOnInit() {
    this.placeHolderText = `Type in ${this.data.confirmationKeyword} to continue`;
    if (this.data.additionalParam) {
      this.additionalParam = this.data.additionalParam;
    }
  }

  ok(){
    this.dialogRef.close(true);
  }

  cancel() {
    this.dialogRef.close(false);
  }

}
