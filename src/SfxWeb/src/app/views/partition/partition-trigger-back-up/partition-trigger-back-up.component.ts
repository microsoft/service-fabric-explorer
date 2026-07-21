import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { DataService } from 'src/app/services/data.service';
import { Partition } from 'src/app/Models/DataModels/Partition';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IsolatedAction } from 'src/app/Models/Action';

@Component({
    selector: 'app-partition-trigger-back-up',
    templateUrl: './partition-trigger-back-up.component.html',
    styleUrls: ['./partition-trigger-back-up.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class PartitionTriggerBackUpComponent implements OnInit {
  private formBuilder = inject(UntypedFormBuilder);
  private data = inject(DataService);
  partition = inject<IsolatedAction>(MAT_DIALOG_DATA);
  dialogRef = inject<MatDialogRef<PartitionTriggerBackUpComponent>>(MatDialogRef);


  form: UntypedFormGroup;
  ngOnInit() {
    // storage gets set by nested component
    this.form = this.formBuilder.group({
      BackupTimeout: ['', [Validators.required]]
    });
  }

  ok() {
    if (this.form.value.Storage.StorageKind === '')
    {
      this.form.value.Storage = null;
    }
    this.data.restClient.triggerPartitionBackup(this.partition.data, this.form.value.BackupTimeout, this.form.value.Storage).subscribe( () => {
      this.cancel();
    },
    err => console.log(err));
  }

  cancel() {
    this.dialogRef.close();
  }

}
