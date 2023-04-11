import { Component, OnInit, Injector } from '@angular/core';
import { ApplicationBaseControllerDirective } from '../applicationBase';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { ListSettings, ListColumnSetting } from 'src/app/Models/ListSettings';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { ActionCollection } from 'src/app/Models/ActionCollection';
import { TelemetryService } from 'src/app/services/telemetry.service';
import { IsolatedAction, ActionWithConfirmationDialog } from 'src/app/Models/Action';
import { map, mergeMap } from 'rxjs/operators';
import { PartitionDisableBackUpComponent } from 'src/app/modules/backup-restore/partition-disable-back-up/partition-disable-back-up.component';
import { PartitionEnableBackUpComponent } from 'src/app/modules/backup-restore/partition-enable-back-up/partition-enable-back-up.component';

@Component({
  selector: 'app-backup',
  templateUrl: './backup.component.html',
  styleUrls: ['./backup.component.scss']
})
export class BackupComponent extends ApplicationBaseControllerDirective  {

  applicationBackupConfigurationInfoListSettings: ListSettings;
  actions: ActionCollection;

  constructor(protected data: DataService, injector: Injector, private settings: SettingsService, private telemetry: TelemetryService) {
    super(data, injector);
  }

  setup() {
    this.applicationBackupConfigurationInfoListSettings = this.settings.getNewOrExistingListSettings('backupConfigurationInfoCollection', ['raw.PolicyName'], [
      new ListColumnSetting('raw.PolicyName', 'Policy Name', {
        enableFilter: false,
        cssClasses: "link",
        clickEvent: item => item.action.run()
      }),
      new ListColumnSetting('raw.Kind', 'Kind'),
      new ListColumnSetting('raw.PolicyInheritedFrom', 'Policy Inherited From'),
      new ListColumnSetting('raw.ServiceName', 'Service Name'),
      new ListColumnSetting('raw.PartitionId', 'Partition Id'),
      new ListColumnSetting('raw.SuspensionInfo.IsSuspended', 'Is Suspended'),
      new ListColumnSetting('raw.SuspensionInfo.SuspensionInheritedFrom', 'Suspension Inherited From'),
    ]);
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    if (this.data.actionsEnabled()) {
      this.setUpActions();
    }
    return this.app.applicationBackupConfigurationInfoCollection.refresh(messageHandler);
  }


  setUpActions() {
    if (!this.actions) {
      this.actions = new ActionCollection(this.telemetry);


      this.actions.add(new IsolatedAction(
        this.data.dialog,
        'enableApplicationBackup',
        'Enable/Update Application Backup',
        'Enabling Application Backup',
        {
            enable: (backupName: string) => this.data.restClient.enableApplicationBackup(this.app, backupName).pipe(mergeMap(() => {
                return this.app.applicationBackupConfigurationInfoCollection.refresh();
            })),
            data: this
        },
        PartitionEnableBackUpComponent,
        () => true,
    ));

      this.actions.add(new IsolatedAction(
        this.data.dialog,
        'disableApplicationBackup',
        'Disable Application Backup',
        'Disabling Application Backup',
        {
            enable: (cleanBackup: boolean) => this.data.restClient.disableApplicationBackup(this.app, cleanBackup).pipe(mergeMap(() => {
                return this.app.applicationBackupConfigurationInfoCollection.refresh();
             })),
            data: this
        },
        PartitionDisableBackUpComponent,
        () => this.app.applicationBackupConfigurationInfoCollection.collection.length && this.app.applicationBackupConfigurationInfoCollection.collection[0].raw &&
              this.app.applicationBackupConfigurationInfoCollection.collection[0].raw.Kind === 'Application' &&
              this.app.applicationBackupConfigurationInfoCollection.collection[0].raw.PolicyInheritedFrom === 'Application',
    ));

      this.actions.add(new ActionWithConfirmationDialog(
        this.data.dialog,
        'suspendApplicationBackup',
        'Suspend Application Backup',
        'Suspending...',
        () => this.data.restClient.suspendApplicationBackup(this.app.id).pipe(map(() => {
              this.app.applicationBackupConfigurationInfoCollection.refresh();
        })),
        () => this.app.applicationBackupConfigurationInfoCollection.collection.length && this.app.applicationBackupConfigurationInfoCollection.collection[0].raw &&
              this.app.applicationBackupConfigurationInfoCollection.collection[0].raw.Kind === 'Application' &&
              this.app.applicationBackupConfigurationInfoCollection.collection[0].raw.PolicyInheritedFrom === 'Application' &&
              this.app.applicationBackupConfigurationInfoCollection.collection[0].raw.SuspensionInfo.IsSuspended === false,
        'Confirm Application Backup Suspension',
        `Suspend application backup for ${this.app.name} ?`,
        this.app.name));

      this.actions.add(new ActionWithConfirmationDialog(
        this.data.dialog,
        'resumeApplicationBackup',
        'Resume Application Backup',
        'Resuming...',
        () => this.data.restClient.resumeApplicationBackup(this.app.id).pipe(map(() => {
            this.app.applicationBackupConfigurationInfoCollection.refresh();
        })),
        () => this.app.applicationBackupConfigurationInfoCollection.collection.length && this.app.applicationBackupConfigurationInfoCollection.collection[0].raw &&
              this.app.applicationBackupConfigurationInfoCollection.collection[0].raw.Kind === 'Application' &&
              this.app.applicationBackupConfigurationInfoCollection.collection[0].raw.PolicyInheritedFrom === 'Application' &&
              this.app.applicationBackupConfigurationInfoCollection.collection[0].raw.SuspensionInfo.IsSuspended === true,
        'Confirm Application Backup Resumption',
        `Resume application backup for ${this.app.name} ?`,
        this.app.name));
    }
  }

}
