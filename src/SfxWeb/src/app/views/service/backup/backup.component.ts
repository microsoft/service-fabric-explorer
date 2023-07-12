import { Component, OnInit, Injector } from '@angular/core';
import { ServiceBaseControllerDirective } from '../ServiceBase';
import { ListSettings, ListColumnSetting } from 'src/app/Models/ListSettings';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { ActionCollection } from 'src/app/Models/ActionCollection';
import { IsolatedAction, ActionWithConfirmationDialog } from 'src/app/Models/Action';
import { mergeMap, map } from 'rxjs/operators';
import { PartitionEnableBackUpComponent } from 'src/app/modules/backup-restore/partition-enable-back-up/partition-enable-back-up.component';
import { PartitionDisableBackUpComponent } from 'src/app/modules/backup-restore/partition-disable-back-up/partition-disable-back-up.component';
import { TelemetryService } from 'src/app/services/telemetry.service';

@Component({
  selector: 'app-backup',
  templateUrl: './backup.component.html',
  styleUrls: ['./backup.component.scss']
})
export class BackupComponent extends ServiceBaseControllerDirective {
  serviceBackupConfigurationInfoListSettings: ListSettings;
  actions: ActionCollection;


  constructor(protected data: DataService, injector: Injector, private settings: SettingsService, public telemetry: TelemetryService) {
    super(data, injector);
  }

  setup() {
    this.serviceBackupConfigurationInfoListSettings = this.settings.getNewOrExistingListSettings('serviceBackupConfigurationInfoListSettings', ['raw.PolicyName'], [
      new ListColumnSetting('raw.PolicyName', 'Policy Name', {
        enableFilter: false,
        cssClasses: "link",
        clickEvent: item => item.action.run()
      }),
      new ListColumnSetting('raw.Kind', 'Kind'),
      new ListColumnSetting('raw.PolicyInheritedFrom', 'Policy Inherited From'),
      new ListColumnSetting('raw.PartitionId', 'Partition Id'),
      new ListColumnSetting('raw.SuspensionInfo.IsSuspended', 'Is Suspended'),
      new ListColumnSetting('raw.SuspensionInfo.SuspensionInheritedFrom', 'Suspension Inherited From'),
    ]);
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{

    if (this.data.actionsEnabled()) {
      this.setupActions();
    }


    this.service.serviceBackupConfigurationInfoCollection.refresh(messageHandler);
    return this.data.refreshBackupPolicies(messageHandler);
  }

  setupActions() {
    if (!this.actions) {
      this.actions = new ActionCollection(this.telemetry);
      this.actions.add(new IsolatedAction(
        this.data.dialog,
        'enableServiceBackup',
        'Enable/Update Service Backup',
        'Enabling Service Backup',
        {
            enable: (backupName: string) => this.data.restClient.enableServiceBackup(this.service, backupName).pipe(mergeMap(() => {
                return this.service.serviceBackupConfigurationInfoCollection.refresh();
            })),
            data: this
        },
        PartitionEnableBackUpComponent,
        () => true,
    ));

      this.actions.add(new IsolatedAction(
        this.data.dialog,
        'disableApplicationBackup',
        'Disable Service Backup',
        'Disabling Service Backup',
        {
            enable: (cleanBackup: boolean) => this.data.restClient.disableServiceBackup(this.service, cleanBackup).pipe(mergeMap(() => {
              return this.service.serviceBackupConfigurationInfoCollection.refresh();
             })),
            data: this
        },
        PartitionDisableBackUpComponent,
        () => this.service.serviceBackupConfigurationInfoCollection.collection.length && this.service.serviceBackupConfigurationInfoCollection.collection[0].raw &&
              this.service.serviceBackupConfigurationInfoCollection.collection[0].raw.Kind === 'Service' &&
              this.service.serviceBackupConfigurationInfoCollection.collection[0].raw.PolicyInheritedFrom === 'Service',
    ));

      this.actions.add(new ActionWithConfirmationDialog(
        this.data.dialog,
        'suspendServiceBackup',
        'Suspend Service Backup',
        'Suspending...',
        () => this.data.restClient.suspendServiceBackup(this.service.id).pipe(map(() => {
            return this.service.serviceBackupConfigurationInfoCollection.refresh();
        })),
        () => this.service.serviceBackupConfigurationInfoCollection.collection.length && this.service.serviceBackupConfigurationInfoCollection.collection[0].raw &&
              this.service.serviceBackupConfigurationInfoCollection.collection[0].raw.Kind === 'Service' &&
              this.service.serviceBackupConfigurationInfoCollection.collection[0].raw.PolicyInheritedFrom === 'Service' &&
              this.service.serviceBackupConfigurationInfoCollection.collection[0].raw.SuspensionInfo.IsSuspended === false,
        'Confirm Service Backup Suspension',
        `Suspend Service backup for ${this.service.name} ?`,
        this.service.name));

      this.actions.add(new ActionWithConfirmationDialog(
        this.data.dialog,
        'resumeServiceBackup',
        'Resume Service Backup',
        'Resuming...',
        () => this.data.restClient.resumeApplicationBackup(this.service.id).pipe(map(() => {
            return this.service.serviceBackupConfigurationInfoCollection.refresh();
        })),
        () => this.service.serviceBackupConfigurationInfoCollection.collection.length && this.service.serviceBackupConfigurationInfoCollection.collection[0].raw &&
              this.service.serviceBackupConfigurationInfoCollection.collection[0].raw.Kind === 'Service' &&
              this.service.serviceBackupConfigurationInfoCollection.collection[0].raw.PolicyInheritedFrom === 'Service' &&
              this.service.serviceBackupConfigurationInfoCollection.collection[0].raw.SuspensionInfo.IsSuspended === true,
        'Confirm Service Backup Resumption',
        `Resume Service backup for ${this.service.name} ?`,
        this.service.name));
    }
  }

}
