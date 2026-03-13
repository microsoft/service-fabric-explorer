// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, OnInit, Inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { DataService } from 'src/app/services/data.service';
import { Partition } from 'src/app/Models/DataModels/Partition';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IsolatedAction } from 'src/app/Models/Action';

@Component({
  selector: 'app-partition-restore-back-up',
  templateUrl: './partition-restore-back-up.component.html',
  styleUrls: ['./partition-restore-back-up.component.scss']
})
export class PartitionRestoreBackUpComponent implements OnInit {

  form: UntypedFormGroup;

  constructor(private formBuilder: UntypedFormBuilder,
              private data: DataService,
              @Inject(MAT_DIALOG_DATA) public partition: IsolatedAction,
              public dialogRef: MatDialogRef<PartitionRestoreBackUpComponent>) { }

  ngOnInit() {
    this.form = this.formBuilder.group({
      BackupId: ['', [Validators.required]],
      BackupLocation: ['', [Validators.required]],
      RestoreTimeout: ['']
    });
  }

  ok() {
    if (this.form.value.Storage.StorageKind === '')
    {
      this.form.value.Storage = null;
    }
    const values = this.form.value;
    this.data.restClient.restorePartitionBackup(this.partition.data.id, values.Storage, values.RestoreTimeout, values.BackupId, values.BackupLocation).subscribe( () => {
      this.cancel();
    },
    err => console.log(err));
  }

  cancel() {
    this.dialogRef.close();
  }

}
