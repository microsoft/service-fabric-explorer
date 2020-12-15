import { Component, OnInit, Inject, Input } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IsolatedAction } from 'src/app/Models/Action';
import { DataService } from 'src/app/services/data.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PathLocationStrategy } from '@angular/common';
import { BackupPolicyCollection } from 'src/app/Models/DataModels/collections/Collections';
import { InvokeFunctionExpr } from '@angular/compiler';
import { map } from 'rxjs/operators';
import { IRawBackupEntity } from 'src/app/Models/RawDataTypes';
import { Observable } from 'rxjs/internal/Observable';

@Component({
  selector: 'app-get-backup-enabled-entities',
  templateUrl: './get-backup-enabled-entities.component.html',
  styleUrls: ['./get-backup-enabled-entities.component.scss']
})

export class GetBackupEnabledEntitiesComponent implements OnInit {

  MaxResults: number;
  ContinuationToken: string;
  TimeOut: number;
  rawdata: IRawBackupEntity[];
  response = '';
  constructor(public dialogRef: MatDialogRef<GetBackupEnabledEntitiesComponent>,
              @Inject(MAT_DIALOG_DATA) public data: IsolatedAction, public dataService: DataService) {
      this.MaxResults = 0;
      this.ContinuationToken = '';
      this.TimeOut = 60;
     }

  ngOnInit(){
    this.rawdata = this.data.data.backupEntity;
  }
  getBackupEnabledEntities(): Observable<IRawBackupEntity[]>
  {
    return this.dataService.restClient.getBackupEnabledEntities(this.data.data);
  }

  cancel() {
    this.dialogRef.close();
  }

}
