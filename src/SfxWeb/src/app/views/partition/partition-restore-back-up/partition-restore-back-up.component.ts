import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService } from 'src/app/services/data.service';
import { Partition } from 'src/app/Models/DataModels/Partition';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-partition-restore-back-up',
  templateUrl: './partition-restore-back-up.component.html',
  styleUrls: ['./partition-restore-back-up.component.scss']
})
export class PartitionRestoreBackUpComponent implements OnInit {

  form: FormGroup;

  constructor(private formBuilder: FormBuilder,
              private data: DataService,
              @Inject(MAT_DIALOG_DATA) public partition: Partition,
              public dialogRef: MatDialogRef<PartitionRestoreBackUpComponent>) { }

  ngOnInit() {
    this.form = this.formBuilder.group({
      BackupId: ['', [Validators.required]],
      BackupLocation: ['', [Validators.required]],
      RestoreTimeout: ['']
    });
  }

  ok() {
    const values = this.form.value;
    this.data.restClient.restorePartitionBackup(this.partition, values.Storage, values.RestoreTimeout, values.BackupId, values.BackupLocation).subscribe( () => {
      this.cancel();
    },
    err => console.log(err));
  }

  cancel() {
    this.dialogRef.close();
  }

}
