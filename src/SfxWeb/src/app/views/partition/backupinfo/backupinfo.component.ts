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
  backupinfo : IRawPartitionBackup
  constructor(public dialogRef: MatDialogRef<BackupinfoComponent>,
  @Inject(MAT_DIALOG_DATA) public data: IsolatedAction, injector: Injector) {
    this.backupinfo = data.data;
   }

  ngOnInit() {
  }
 
}
