import { Component, OnInit, Injector } from '@angular/core';
import { ServiceBaseControllerDirective } from '../ServiceBase';
import { ListSettings, ListColumnSetting } from 'src/app/Models/ListSettings';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { IResponseMessageHandler, ResponseMessageHandlers } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { ActionCollection } from 'src/app/Models/ActionCollection';
import { IsolatedAction, ActionWithConfirmationDialog } from 'src/app/Models/Action';
import { mergeMap, map } from 'rxjs/operators';
import { PartitionEnableBackUpComponent } from 'src/app/modules/backup-restore/partition-enable-back-up/partition-enable-back-up.component';
import { PartitionDisableBackUpComponent } from 'src/app/modules/backup-restore/partition-disable-back-up/partition-disable-back-up.component';
import { TelemetryService } from 'src/app/services/telemetry.service';
import { InfrastructureJob } from 'src/app/Models/DataModels/infrastructureJob';
import { IRawInfrastructureJob } from 'src/app/Models/RawDataTypes';
import { DashboardViewModel, IDashboardViewModel } from 'src/app/ViewModels/DashboardViewModels';

@Component({
  selector: 'app-infrastructurejobs',
  templateUrl: './infrastructurejobs.component.html',
  styleUrls: ['./infrastructurejobs.component.scss']
})
export class InfrastructureJobsComponent extends ServiceBaseControllerDirective {
  allManagementJobs: InfrastructureJob[];
  executingManagementJob : InfrastructureJob; 
  listSettings : ListSettings;
  tiles: IDashboardViewModel;


  constructor(protected data: DataService, injector: Injector, private settings: SettingsService, public telemetry: TelemetryService) {
    super(data, injector);
  }

  setup() {
    this.data.restClient.getInfrastructureJobs(this.serviceId).subscribe(mrJobdata =>  this.getInfrastructureData(mrJobdata));
  }

  getInfrastructureData(mrJobdata: IRawInfrastructureJob[]): void {
    const dateRef = new Date();
     this.allManagementJobs = []
      mrJobdata.forEach(rawMrJob => {
        this.allManagementJobs.push(new InfrastructureJob(this.data, rawMrJob, dateRef));
      })

      this.listSettings = this.settings.getNewOrExistingListSettings('nodes', ['name'], [
        new ListColumnSetting('raw.IsActive', 'Active'),
        new ListColumnSetting('raw.ActionStatus', 'Action Status'),
        new ListColumnSetting('raw.CurrentUD', 'Upgrade Domain'),
        new ListColumnSetting('raw.ImpactAction', 'Impact Action'),
        new ListColumnSetting('raw.ImpactStep', 'Impact Step'),
        new ListColumnSetting('raw.Id', 'Job Id'),
        new ListColumnSetting('RepairTask.TaskId', 'Repair Task')
      ]);
    this.executingManagementJob = this.allManagementJobs.find(job => Boolean(job.raw.IsActive) == true);
    this.tiles = DashboardViewModel.fromHealthStateCount(this.executingManagementJob.id, this.executingManagementJob.raw.CurrentUD, false, {
      ErrorCount: parseInt(this.executingManagementJob.raw.CurrentUD),
      WarningCount: 0,
      OkCount: 1,
    })
  };
}
