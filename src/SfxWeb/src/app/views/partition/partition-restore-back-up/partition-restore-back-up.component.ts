import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-partition-restore-back-up',
  templateUrl: './partition-restore-back-up.component.html',
  styleUrls: ['./partition-restore-back-up.component.scss']
})
export class PartitionRestoreBackUpComponent implements OnInit {

  form: FormGroup

  constructor(private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.form = this.formBuilder.group({
      BackupId: [""],
      BackupLocation: [""],
      RestoreTimeout: ["", [Validators.required]]
    })
  }

}
