import { Component, OnInit, Injector } from '@angular/core';
import { BaseController } from 'src/app/ViewModels/BaseController';
import { ListSettings } from 'src/app/Models/ListSettings';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { BackupPolicyCollection } from 'src/app/Models/DataModels/collections/Collections';
import { ActionCollection } from 'src/app/Models/ActionCollection';
import { IsolatedAction } from 'src/app/Models/Action';
import { ActionCreateBackupPolicyComponent } from '../action-create-backup-policy/action-create-backup-policy.component';

@Component({
  selector: 'app-backups',
  templateUrl: './backups.component.html',
  styleUrls: ['./backups.component.scss']
})
export class BackupsComponent extends BaseController {

  backupPolicyListSettings: ListSettings;
  backupPolicies: BackupPolicyCollection;
  actions: ActionCollection;

  constructor(private data: DataService, private settings: SettingsService, injector: Injector) {
    super(injector);
   }

  setup(){
    this.backupPolicyListSettings = this.settings.getNewOrExistingBackupPolicyListSettings();
    this.backupPolicies = this.data.backupPolicies;
    this.actions = new ActionCollection(this.data.telemetry);

    if (this.data.actionsEnabled()) {
      this.setupActions();
    }
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return this.data.backupPolicies.refresh(messageHandler);
  }

  private setupActions() {
    this.actions.add(new IsolatedAction(
      this.data.dialog,
      'createBackupPolicy',
      'Create Backup Policy',
      'Creating',
      null,
      ActionCreateBackupPolicyComponent,
      () => true
    ));
  }
}
