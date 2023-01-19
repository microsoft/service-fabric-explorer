import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IsolatedAction } from 'src/app/Models/Action';
import { ApplicationType } from 'src/app/Models/DataModels/ApplicationType';
import { Validators, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Constants } from 'src/app/Common/Constants';

@Component({
  selector: 'app-create-application',
  templateUrl: './create-application.component.html',
  styleUrls: ['./create-application.component.scss']
})
export class CreateApplicationComponent implements OnInit {

  app: ApplicationType;
  form: UntypedFormGroup;

  constructor(public dialogRef: MatDialogRef<CreateApplicationComponent>,
              @Inject(MAT_DIALOG_DATA) public data: IsolatedAction,
              private formBuilder: UntypedFormBuilder) { }

  ngOnInit(): void {
   this.app = this.data.data.appType;
   this.form = this.formBuilder.group({
    userInput: [Constants.FabricPrefix + this.app.name, [Validators.required, Validators.pattern(/^fabric:\/.+/)]]
    });
  }

  ok(){
    this.app.createInstance(this.form.value.userInput).subscribe(
      () => this.close(),
      () => console.log('failed to create application')
    );
  }

  close() {
    this.dialogRef.close(false);
  }

}
