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
import { ListColumnSetting, ListSettings } from 'src/app/Models/ListSettings';
import { SettingsService } from 'src/app/services/settings.service';

@Component({
  selector: 'app-get-backup-enabled-entities',
  templateUrl: './get-backup-enabled-entities.component.html',
  styleUrls: ['./get-backup-enabled-entities.component.scss']
})

export class GetBackupEnabledEntitiesComponent implements OnInit {
  rawdata: IRawBackupEntity[];
  response = '';
  backupEnabledEntitiesInfoListSettings: ListSettings;
  constructor(public dialogRef: MatDialogRef<GetBackupEnabledEntitiesComponent>,
              @Inject(MAT_DIALOG_DATA) public data: IsolatedAction, public dataService: DataService) {
     }

  ngOnInit(){
    this.rawdata = this.data.data.backupEntity;
    this.backupEnabledEntitiesInfoListSettings = new ListSettings(10, null, [
      new ListColumnSetting('EntityKind', 'Entity Kind'),
      new ListColumnSetting('ApplicationName', 'Application Name'),
      new ListColumnSetting('ServiceName', 'Service Name'),
      new ListColumnSetting('PartitionId', 'Partition Id'),
    ]);
  }

  cancel() {
    this.dialogRef.close();
  }

}
