import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-partition-trigger-back-up',
  templateUrl: './partition-trigger-back-up.component.html',
  styleUrls: ['./partition-trigger-back-up.component.scss']
})
export class PartitionTriggerBackUpComponent implements OnInit {

  form: FormGroup

  constructor(private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.form = this.formBuilder.group({
      BackupTimeout: ["", [Validators.required]]
    })
  }
}
