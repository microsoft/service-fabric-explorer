import { Component, OnInit, Injector } from '@angular/core';
import { ListSettings, ListColumnSetting } from 'src/app/Models/ListSettings';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { PartitionBaseControllerDirective } from '../PartitionBase';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { ActionCollection } from 'src/app/Models/ActionCollection';
import { TelemetryService } from 'src/app/services/telemetry.service';
import { ActionWithConfirmationDialog, IsolatedAction } from 'src/app/Models/Action';
import { mergeMap } from 'rxjs/operators';
import { PartitionDisableBackUpComponent } from 'src/app/modules/backup-restore/partition-disable-back-up/partition-disable-back-up.component';
import { PartitionEnableBackUpComponent } from 'src/app/modules/backup-restore/partition-enable-back-up/partition-enable-back-up.component';
import { PartitionTriggerBackUpComponent } from '../partition-trigger-back-up/partition-trigger-back-up.component';
import { PartitionRestoreBackUpComponent } from '../partition-restore-back-up/partition-restore-back-up.component';
import { IOnDateChange } from 'src/app/modules/time-picker/double-slider/double-slider.component';

@Component({
  selector: 'app-backups',
  templateUrl: './backups.component.html',
  styleUrls: ['./backups.component.scss']
})
export class BackupsComponent extends PartitionBaseControllerDirective {

  partitionBackupListSettings: ListSettings;
  actions: ActionCollection;
  startDate: Date = new Date();
  endDate: Date = new Date();
  minDate: Date = new Date();
  maxDate: Date = new Date();
  startTime: any;
  endTime: any;

  constructor(protected data: DataService, injector: Injector, private settings: SettingsService, public telemetry: TelemetryService) {
    super(data, injector);
  }
  backupList: any;
  dateRefresh: boolean;

  setup(){
    this.partitionBackupListSettings = this.settings.getNewOrExistingListSettings('partitionBackups', [null], [
      new ListColumnSetting('raw.BackupId', 'BackupId', {
        enableFilter: false,
        cssClasses: "link",
        clickEvent: item => item.action.run()
      }),
      new ListColumnSetting('raw.BackupType', 'BackupType'),
      new ListColumnSetting('raw.EpochOfLastBackupRecord.DataLossVersion', 'Data Loss Version'),
      new ListColumnSetting('raw.EpochOfLastBackupRecord.ConfigurationVersion', 'Configuration Version'),
      new ListColumnSetting('raw.LsnOfLastBackupRecord', 'Lsn of last Backup Record'),
      new ListColumnSetting('raw.CreationTimeUtc', 'Creation Time UTC'),
    ]);
    this.dateRefresh = true;

    this.maxDate.setDate(this.endDate.getDate() + 30);
    this.minDate.setDate(this.startDate.getDate() - 30);
  }

  startTimeChange(){
    const time = this.startTime.split(':');
    this.startDate.setUTCHours(parseInt(time[0], 10), parseInt(time[1], 10), parseInt(time[2], 10), 0);
    this.setNewPartitionBackupList(this.startDate, this.endDate);
  }

  endTimeChange(){
    const time = this.endTime.split(':');
    this.endDate.setUTCHours(parseInt(time[0], 10), parseInt(time[1], 10), parseInt(time[2], 10), 0);
    this.setNewPartitionBackupList(this.startDate, this.endDate);
  }

  setNewPartitionBackupList(startDate: Date, endDate: Date)
  {
    this.backupList = this.partition.partitionBackupInfo.partitionBackupList.collection;
    this.backupList = this.backupList.filter((info) => {
      return (new Date(info.raw.CreationTimeUtc) >= startDate && new Date(info.raw.CreationTimeUtc) <= endDate);
    });
  }

  restore() {
    let rawData: any;
    rawData = this.partition.partitionBackupInfo.latestPartitionBackup.collection[0].raw;
    this.data.restClient.restorePartitionBackup(
      rawData.PartitionInformation.Id,
      null,
      null,
      this.partition.partitionBackupInfo.latestPartitionBackup.collection[0].raw.BackupId,
      this.partition.partitionBackupInfo.latestPartitionBackup.collection[0].raw.BackupLocation
      ).subscribe( () => {
    },
    err => console.log(err));
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    if (this.data.actionsEnabled()) {
      this.attemptSetActions();
    }
    if (this.dateRefresh) {
      this.backupList = this.partition.partitionBackupInfo.partitionBackupList.collection;
      if (this.backupList.length !== 0)
      {
        const templist = this.backupList.sort((left, right): number => {
          if (left.CreationTimeUtc < right.CreationTimeUtc) {
            return -1;
          }
          if (left.CreationTimeUtc > right.CreationTimeUtc) {
            return 1;
          }
          return 0;
        });
        this.startDate = new Date(templist[0].raw.CreationTimeUtc);
        this.endDate = new Date(templist[templist.length - 1].raw.CreationTimeUtc);
        this.maxDate.setDate(this.endDate.getDate() + 30);
        this.minDate.setDate(this.startDate.getDate() - 30);
        this.startTime = templist[0].raw.CreationTimeUtc.split('T')[1].split('Z')[0];
        this.endTime = templist[templist.length - 1].raw.CreationTimeUtc.split('T')[1].split('Z')[0];
        this.dateRefresh = false;
      }
    }
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

    return this.partition.partitionBackupInfo.partitionBackupList.refresh(messageHandler);
  }

  setNewDates(dates: IOnDateChange) {
    this.startDate = dates.startDate;
    this.endDate = dates.endDate;
    this.setNewPartitionBackupList(this.startDate, this.endDate);
  }

  attemptSetActions() {
    if (!this.actions) {
      this.actions = new ActionCollection(this.telemetry);

      this.actions.add(new IsolatedAction(
        this.data.dialog,
        'enablePartitionBackup',
        'Enable/Update Partition Backup',
        'Enabling Partition Backup',
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
          'disablePartitionBackup',
          'Disable Partition Backup',
          'Disabling Partition Backup',
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
          'suspendPartitionBackup',
          'Suspend Partition Backup',
          'Suspending...',
          () => this.data.restClient.suspendPartitionBackup(this.partition.id).pipe(mergeMap(() => {
              return this.partition.partitionBackupInfo.partitionBackupConfigurationInfo.refresh();
          })),
          () => this.partition.partitionBackupInfo.partitionBackupConfigurationInfo.raw &&
                this.partition.partitionBackupInfo.partitionBackupConfigurationInfo.raw.Kind === 'Partition' &&
                this.partition.partitionBackupInfo.partitionBackupConfigurationInfo.raw.PolicyInheritedFrom === 'Partition' &&
                this.partition.partitionBackupInfo.partitionBackupConfigurationInfo.raw.SuspensionInfo.IsSuspended === false,
          {
            title: 'Confirm Partition Backup Suspension'
          },
          {
            inputs: {
                message: `Suspend partition backup for ${this.partition.name} ?`,
                confirmationKeyword: this.partition.name
            }
          }));

      this.actions.add(new ActionWithConfirmationDialog(
          this.data.dialog,
          'resumePartitionBackup',
          'Resume Partition Backup',
          'Resuming...',
          () => this.data.restClient.resumePartitionBackup(this.partition.id).pipe(mergeMap(() => {
              return this.partition.partitionBackupInfo.partitionBackupConfigurationInfo.refresh();
          })),
          () => this.partition.partitionBackupInfo.partitionBackupConfigurationInfo.raw &&
                this.partition.partitionBackupInfo.partitionBackupConfigurationInfo.raw.Kind === 'Partition' &&
                this.partition.partitionBackupInfo.partitionBackupConfigurationInfo.raw.PolicyInheritedFrom === 'Partition' &&
          this.partition.partitionBackupInfo.partitionBackupConfigurationInfo.raw.SuspensionInfo.IsSuspended === true,
          {
            title: 'Confirm Partition Backup Resumption'
          },
          {
            inputs: {
                message: `Resume partition backup for ${this.partition.name} ?`,
                confirmationKeyword: this.partition.name
            }
          }));

      this.actions.add(new IsolatedAction(
          this.data.dialog,
          'triggerPartitionBackup',
          'Trigger Partition Backup',
          'Triggering Partition Backup',
          this.partition,
          PartitionTriggerBackUpComponent,
          () => true
      ));

      this.actions.add(new IsolatedAction(
          this.data.dialog,
          'restorePartitionBackup',
          'Restore Partition Backup',
          'Restoring Partition Backup',
          this.partition,
          PartitionRestoreBackUpComponent,
          () => true
      ));
      }

  }
}
