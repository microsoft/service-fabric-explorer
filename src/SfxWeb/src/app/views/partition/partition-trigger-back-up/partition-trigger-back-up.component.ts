import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService } from 'src/app/services/data.service';
import { Partition } from 'src/app/Models/DataModels/Partition';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-partition-trigger-back-up',
  templateUrl: './partition-trigger-back-up.component.html',
  styleUrls: ['./partition-trigger-back-up.component.scss']
})
export class PartitionTriggerBackUpComponent implements OnInit {

  form: FormGroup;

  constructor(private formBuilder: FormBuilder,
              private data: DataService,
              @Inject(MAT_DIALOG_DATA) public partition: Partition,
              public dialogRef: MatDialogRef<PartitionTriggerBackUpComponent>) { }
  ngOnInit() {
    // storage gets set by nested component
    this.form = this.formBuilder.group({
      BackupTimeout: ['', [Validators.required]]
    });
  }

  ok() {
    this.data.restClient.triggerPartitionBackup(this.partition, this.form.value.BackupTimeout, this.form.value.Storage).subscribe( () => {
      this.cancel();
    },
    err => console.log(err));
  }

  cancel() {
    this.dialogRef.close();
  }

}
