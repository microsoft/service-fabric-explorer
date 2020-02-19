import { Component, OnInit, Injector } from '@angular/core';
import { ListSettings, ListColumnSetting } from 'src/app/Models/ListSettings';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { PartitionBaseController } from '../PartitionBase';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable, of } from 'rxjs';
import { ActionCollection } from 'src/app/Models/ActionCollection';
import { TelemetryService } from 'src/app/services/telemetry.service';
import { ActionWithConfirmationDialog, IsolatedAction } from 'src/app/Models/Action';
import { mergeMap, catchError } from 'rxjs/operators';
import { PartitionDisableBackUpComponent } from 'src/app/modules/backup-restore/partition-disable-back-up/partition-disable-back-up.component';
import { PartitionEnableBackUpComponent } from 'src/app/modules/backup-restore/partition-enable-back-up/partition-enable-back-up.component';
import { PartitionTriggerBackUpComponent } from '../partition-trigger-back-up/partition-trigger-back-up.component';
import { PartitionRestoreBackUpComponent } from '../partition-restore-back-up/partition-restore-back-up.component';

@Component({
  selector: 'app-backups',
  templateUrl: './backups.component.html',
  styleUrls: ['./backups.component.scss']
})
export class BackupsComponent extends PartitionBaseController {

  partitionBackupListSettings: ListSettings;
  actions: ActionCollection;

  constructor(protected data: DataService, injector: Injector, private settings: SettingsService, public telemetry: TelemetryService) { 
    super(data, injector);
  }

  setup() {
    this.partitionBackupListSettings = this.settings.getNewOrExistingListSettings("partitionBackups", [null], [
      new ListColumnSetting("raw.BackupId", "BackupId", ["raw.BackupId"], false, (item, property) => property, 1, item => item.action.run()),
      new ListColumnSetting("raw.BackupType", "BackupType"),
      new ListColumnSetting("raw.EpochOfLastBackupRecord.DataLossVersion", "Data Loss Version"),
      new ListColumnSetting("raw.EpochOfLastBackupRecord.ConfigurationVersion", "Configuration Version"),
      new ListColumnSetting("raw.LsnOfLastBackupRecord", "Lsn of last Backup Record"),
      new ListColumnSetting("raw.CreationTimeUtc", "Creation Time Utc"),
    ]);
    console.log(this);
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    this.attemptSetActions();
    try {
      this.subscriptions.add(this.partition.partitionBackupInfo.partitionBackupConfigurationInfo.refresh(messageHandler).subscribe());
    } catch {}
    try {
      this.subscriptions.add(this.data.backupPolicies.refresh(messageHandler).subscribe());
    } catch {}
    try {
      this.subscriptions.add(this.partition.partitionBackupInfo.partitionBackupProgress.refresh(messageHandler).subscribe());
    } catch {}
    try {
      this.subscriptions.add(this.partition.partitionBackupInfo.partitionRestoreProgress.refresh(messageHandler).subscribe());
    } catch {}
    try {
      this.subscriptions.add(this.partition.partitionBackupInfo.latestPartitionBackup.refresh(messageHandler).subscribe());
    } catch {}
    // this.subscriptions.add(this.data.backupPolicies.refresh(messageHandler).subscribe());
    // this.subscriptions.add(this.partition.partitionBackupInfo.partitionBackupProgress.refresh(messageHandler).subscribe());
    // this.subscriptions.add(this.partition.partitionBackupInfo.partitionRestoreProgress.refresh(messageHandler).subscribe());
    // this.subscriptions.add(this.partition.partitionBackupInfo.latestPartitionBackup.refresh(messageHandler).subscribe());


    //  this.partition.partitionBackupInfo.partitionBackupConfigurationInfo.refresh(messageHandler);
    // this.data.backupPolicies.refresh(messageHandler);
    // this.partition.partitionBackupInfo.partitionBackupProgress.refresh(messageHandler);
    // this.partition.partitionBackupInfo.partitionRestoreProgress.refresh(messageHandler);
    // this.partition.partitionBackupInfo.latestPartitionBackup.refresh(messageHandler);

    return this.partition.partitionBackupInfo.partitionBackupList.refresh(messageHandler);
  }


  attemptSetActions() {
    if(!this.actions) {
      this.actions = new ActionCollection(this.telemetry);

      this.actions.add(new IsolatedAction(
        this.data.dialog,
        "enablePartitionBackup",
        "Enable/Update Partition Backup",
        "Enabling Partition Backup",
        {
          enable: (backupName: string) => this.data.restClient.enablePartitionBackup(this.partition, backupName).pipe(mergeMap(() => {
              return this.partition.partitionBackupInfo.partitionBackupConfigurationInfo.refresh();
          })),
          data: this
        },
        PartitionEnableBackUpComponent,
        () => true
      ));
  
      this.actions.add(new IsolatedAction(
          this.data.dialog,
          "disablePartitionBackup",
          "Disable Partition Backup",
          "Disabling Partition Backup",
          {
            enable: (cleanBackup: boolean) => this.data.restClient.disablePartitionBackup(this.partition, cleanBackup).pipe(mergeMap(() => {
                return this.partition.partitionBackupInfo.partitionBackupConfigurationInfo.refresh();
            })),
            data: this
          },
          PartitionDisableBackUpComponent,
          () => true
      ));
  
      this.actions.add(new ActionWithConfirmationDialog(
          this.data.dialog,
          "suspendPartitionBackup",
          "Suspend Partition Backup",
          "Suspending...",
          () => this.data.restClient.suspendPartitionBackup(this.partition.id).pipe(mergeMap(() => {
              return this.partition.partitionBackupInfo.partitionBackupConfigurationInfo.refresh();
          })),
          () => this.partition.partitionBackupInfo.partitionBackupConfigurationInfo.raw && 
                this.partition.partitionBackupInfo.partitionBackupConfigurationInfo.raw.Kind === "Partition" &&
                this.partition.partitionBackupInfo.partitionBackupConfigurationInfo.raw.PolicyInheritedFrom === "Partition" &&
                this.partition.partitionBackupInfo.partitionBackupConfigurationInfo.raw.SuspensionInfo.IsSuspended === false,
          "Confirm Partition Backup Suspension",
          `Suspend partition backup for ${this.partition.name} ?`,
          this.partition.name));
  
      this.actions.add(new ActionWithConfirmationDialog(
          this.data.dialog,
          "resumePartitionBackup",
          "Resume Partition Backup",
          "Resuming...",
          () => this.data.restClient.resumePartitionBackup(this.partition.id).pipe(mergeMap(() => {
              return this.partition.partitionBackupInfo.partitionBackupConfigurationInfo.refresh();
          })),
          () => this.partition.partitionBackupInfo.partitionBackupConfigurationInfo.raw && 
                this.partition.partitionBackupInfo.partitionBackupConfigurationInfo.raw.Kind === "Partition" &&
                this.partition.partitionBackupInfo.partitionBackupConfigurationInfo.raw.PolicyInheritedFrom === "Partition" &&
                this.partition.partitionBackupInfo.partitionBackupConfigurationInfo.raw.SuspensionInfo.IsSuspended === true,
          "Confirm Partition Backup Resumption",
          `Resume partition backup for ${this.partition.name} ?`,
          this.partition.name));
  
      this.actions.add(new IsolatedAction(
          this.data.dialog,
          "triggerPartitionBackup",
          "Trigger Partition Backup",
          "Triggering Partition Backup",
          {},
          PartitionTriggerBackUpComponent,
          () => true
          // () => this.data.restClient.triggerPartitionBackup(this),
          // () => true,
          // <angular.ui.bootstrap.IModalSettings>{
          //     templateUrl: "partials/triggerPartitionBackup.html",
          //     controller: ActionController,
          //     resolve: {
          //         action: () => this
          //     }
          // },
          // null
      ));
    
      this.actions.add(new IsolatedAction(
          this.data.dialog,
          "restorePartitionBackup",
          "Restore Partition Backup",
          "Restoring Partition Backup",
          {},
          PartitionRestoreBackUpComponent,
          () => true
          // () => this.data.restClient.restorePartitionBackup(this),
          // () => true,
          // <angular.ui.bootstrap.IModalSettings>{
          //     templateUrl: "partials/restorePartitionBackup.html",
          //     controller: ActionController,
          //     resolve: {
          //         action: () => this
          //     }
          // },
          // null
      ));
      }
    
  }
}
