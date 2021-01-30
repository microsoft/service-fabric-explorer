import { Component, Inject, Injector, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IsolatedAction } from 'src/app/Models/Action';
import { IRawPartitionBackup } from 'src/app/Models/RawDataTypes';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-backupinfo',
  templateUrl: './backupinfo.component.html',
  styleUrls: ['./backupinfo.component.scss']
})
export class BackupinfoComponent implements OnInit {
  backupinfo: any;
  constructor(public dialogRef: MatDialogRef<BackupinfoComponent>,
              @Inject(MAT_DIALOG_DATA) public data: IsolatedAction, injector: Injector, private dataService: DataService) {
    this.backupinfo = data.data;
   }

  ngOnInit() {
  }

  restore()
  {
    this.dataService.restClient.restorePartitionBackup(this.backupinfo.PartitionInformation.Id, null, null, this.backupinfo.BackupId, this.backupinfo.BackupLocation).subscribe( () => {
      this.cancel();
    },
    err => console.log(err));
  }
  cancel() {
    this.dialogRef.close();
  }
}
