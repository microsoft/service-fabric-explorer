import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IsolatedAction } from 'src/app/Models/Action';
import { DataService } from 'src/app/services/data.service';

@Component({
    selector: 'app-partition-disable-back-up',
    templateUrl: './partition-disable-back-up.component.html',
    styleUrls: ['./partition-disable-back-up.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class PartitionDisableBackUpComponent {
  dialogRef = inject<MatDialogRef<PartitionDisableBackUpComponent>>(MatDialogRef);
  data = inject<IsolatedAction>(MAT_DIALOG_DATA);
  dataService = inject(DataService);


  cleanBackup = false;

  ok(){
    this.data.data.enable(this.cleanBackup).subscribe( () => {
      this.dialogRef.close(false);
    },
    err => {
      console.log(err);
    });
  }

  cancel() {
    this.dialogRef.close(false);
  }

}
