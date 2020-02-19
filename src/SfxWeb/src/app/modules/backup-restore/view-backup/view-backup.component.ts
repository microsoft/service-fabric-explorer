import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IRawBackupConfigurationInfo, IRawBackupPolicy } from 'src/app/Models/RawDataTypes';
import { Observable } from 'rxjs';
import { IsolatedAction } from 'src/app/Models/Action';
import { ActionCreateBackupPolicyComponent } from 'src/app/views/cluster/action-create-backup-policy/action-create-backup-policy.component';

export interface IViewBackUpData {
  backup: IRawBackupPolicy;
  delete: () => Observable<any>;
}

@Component({
  selector: 'app-view-backup',
  templateUrl: './view-backup.component.html',
  styleUrls: ['./view-backup.component.scss']
})
export class ViewBackupComponent implements OnInit {

  backUpData: IViewBackUpData;

  constructor(public dialogRef: MatDialogRef<ViewBackupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IsolatedAction) {
  }

  ngOnInit() {
    console.log(this.data);
    this.backUpData = this.data.data;
  }

  update() {
    new IsolatedAction(
      this.data.dialog,
      "createBackupPolicy",
      "Create Backup Policy",
      "Creating",
      this.backUpData.backup,
      ActionCreateBackupPolicyComponent,
      () => true
      // () => this.data.restClient.disablePartitionBackup(this).subscribe(() => {
      //     this.partitionBackupInfo.partitionBackupConfigurationInfo.refresh();
      // }),
      // () => this.partitionBackupInfo.partitionBackupConfigurationInfo.raw && this.partitionBackupInfo.partitionBackupConfigurationInfo.raw.Kind === "Partition" && this.partitionBackupInfo.partitionBackupConfigurationInfo.raw.PolicyInheritedFrom === "Partition",
      // <angular.ui.bootstrap.IModalSettings>{
      //     templateUrl: "partials/disableBackup.html",
      //     controller: ActionController,
      //     resolve: {
      //         action: () => this
      //     }
      // },
      // null
    ).run();
  }

  delete() {
    this.backUpData.delete().subscribe();
  }

  close() {
    this.dialogRef.close();
  }

}
