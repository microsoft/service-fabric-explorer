// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IRawBackupConfigurationInfo, IRawBackupEntity, IRawBackupPolicy } from 'src/app/Models/RawDataTypes';
import { Observable } from 'rxjs';
import { IsolatedAction } from 'src/app/Models/Action';
import { ActionCreateBackupPolicyComponent } from 'src/app/views/cluster/action-create-backup-policy/action-create-backup-policy.component';
import { GetBackupEnabledEntitiesComponent } from '../get-backup-enabled-entities/get-backup-enabled-entities.component';
import { DataService } from 'src/app/services/data.service';
import { map } from 'rxjs/operators';

export interface IViewBackUpData {
  backup: IRawBackupPolicy;
  delete: () => Observable<any>;
  getEnabledEntities: () => Observable<IRawBackupEntity>;
}

@Component({
  selector: 'app-view-backup',
  templateUrl: './view-backup.component.html',
  styleUrls: ['./view-backup.component.scss']
})
export class ViewBackupComponent implements OnInit {

  backUpData: IViewBackUpData;
  action: IsolatedAction;
  constructor(public dialogRef: MatDialogRef<ViewBackupComponent>,
              @Inject(MAT_DIALOG_DATA) public data: IsolatedAction, public dataService: DataService) {
  }

  ngOnInit() {
    this.backUpData = this.data.data;
  }
  getEntities() {
    this.action = new IsolatedAction(
      this.data.dialog,
      'getEnabledEntities',
      'Get Enabled Entities',
      'Getting Enabled Entities',
      {
      backupEntity : IRawBackupEntity
      },
      GetBackupEnabledEntitiesComponent,
      () => true,
      () => this.backUpData.getEnabledEntities().pipe(map(entity => this.action.data.backupEntity = entity))
    );
    this.action.run();
  }
  update() {
    new IsolatedAction(
      this.data.dialog,
      'createBackupPolicy',
      'Create Backup Policy',
      'Creating',
      this.backUpData.backup,
      ActionCreateBackupPolicyComponent,
      () => true
    ).run();
  }

  delete() {
    this.backUpData.delete().subscribe();
  }

  close() {
    this.dialogRef.close();
  }

}
