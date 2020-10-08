import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataService } from 'src/app/services/data.service';
import { IsolatedAction } from 'src/app/Models/Action';
import { Service } from 'src/app/Models/DataModels/Service';
import { IRawUpdateServiceDescription } from 'src/app/Models/RawDataTypes';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-scale-service',
  templateUrl: './scale-service.component.html',
  styleUrls: ['./scale-service.component.scss']
})
export class ScaleServiceComponent implements OnInit {

  count: number;
  service: Service;

  updateServiceDescription: IRawUpdateServiceDescription;

  form: FormGroup;

  constructor(public dialogRef: MatDialogRef<ScaleServiceComponent>,
              @Inject(MAT_DIALOG_DATA) public data: IsolatedAction,
              private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.service = this.data.data;
    this.updateServiceDescription = {
      ServiceKind: this.service.serviceKindInNumber,
      Flags: 0x01, // Update InstanceCount flag
      InstanceCount: this.service.description.raw.InstanceCount
    };

    this.form = this.formBuilder.group({
      count: [this.service.description.raw.InstanceCount, [Validators.required, Validators.pattern('^(?:-1|[1-9]\d*)$')]],
    });
  }

  ok() {
    this.updateServiceDescription.InstanceCount = this.form.value.count;
    this.service.updateService(this.updateServiceDescription).subscribe( () => {
      this.close();
    },
    err => {
      console.log(err);
    });
  }

  close() {
    this.dialogRef.close();
  }

}
