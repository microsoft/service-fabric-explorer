import { Component, OnInit, Injector } from '@angular/core';
import { ServiceBaseControllerDirective } from '../ServiceBase';
import { ListSettings, ListColumnSetting, ListColumnSettingWithFilter, ListColumnSettingWithShorten } from 'src/app/Models/ListSettings';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TelemetryService } from 'src/app/services/telemetry.service';
import { InfrastructureJob } from 'src/app/Models/DataModels/infrastructureJob';
import { IRawInfrastructureJob } from 'src/app/Models/RawDataTypes';
import { CompletedInfrastructureJob } from 'src/app/Models/DataModels/completedInfrastructureJob';
import { Constants } from 'src/app/Common/Constants';
import { RepairTask } from 'src/app/Models/DataModels/repairTask';

@Component({
  selector: 'app-infrastructurejobs',
  templateUrl: './infrastructurejobs.component.html',
  styleUrls: ['./infrastructurejobs.component.scss']
})
export class InfrastructureJobsComponent extends ServiceBaseControllerDirective {

  allPendingMRJobs: InfrastructureJob[] = [];
  executingMRJobs: InfrastructureJob[] = [];
  completedMRJobs: CompletedInfrastructureJob[] = [];

  allPendingMRJobsList: ListSettings;
  completedMRJobsList: ListSettings;

  infrastructureJobsSuggestion: string[] = [];

  constructor(protected data: DataService, injector: Injector, private settings: SettingsService, public telemetry: TelemetryService) {
    super(data, injector);
  }

  setup() {
    this.allPendingMRJobsList = this.settings.getNewOrExistingListSettings('allMRJobs', ['raw.CurrentUD'], [
      new ListColumnSetting('raw.Id', 'Job Id'),
      new ListColumnSettingWithFilter('raw.CurrentUD', 'Current UD'),
      new ListColumnSetting('raw.AcknowledgementStatus', 'Acknowledgement Status'),
      new ListColumnSetting('raw.ImpactAction', 'Impact Action'),
      new ListColumnSetting('RepairTask.TaskId', 'Repair Task'),
      new ListColumnSettingWithShorten('raw.RoleInstancesToBeImpacted', 'Target Nodes', 2),
      new ListColumnSetting('raw.IsThrottled', 'Throttled'),
     ]);

    this.completedMRJobsList = this.settings.getNewOrExistingListSettings('completedMRJobs', [], [
      new ListColumnSetting('raw.Id', 'Job Id'),
      new ListColumnSetting('raw.ImpactAction', 'Impact Action'),
      new ListColumnSetting('raw.RoleInstancesToBeImpacted', 'Impacted Nodes'),
    ]);
    this.infrastructureJobsSuggestion = [];
  }

  getInfrastructureData(mrJobdata: IRawInfrastructureJob[]): void {
    const dateRef = new Date();

    this.executingMRJobs = mrJobdata.filter(job => job.JobStatus === 'Executing' && Boolean(job.IsActive)).map(rawMrJob => new InfrastructureJob(this.data, rawMrJob, dateRef));
    this.allPendingMRJobs = mrJobdata.filter(job => job.JobStatus !== 'Completed' && !Boolean(job.IsActive)).map(rawMrJob => new InfrastructureJob(this.data, rawMrJob, dateRef));
    this.completedMRJobs = mrJobdata.filter(job => job.JobStatus === 'Completed').map(rawMrJob => new CompletedInfrastructureJob(this.data, rawMrJob, dateRef));

    this.infrastructureJobsSuggestion = [];

    if (this.executingMRJobs.some(job => {
      const repairTask = this.data.repairCollection.collection.find(rt => rt.id === job.RepairTask.TaskId);
      if (repairTask && repairTask.raw.State === RepairTask.ExecutingStatus && repairTask.getPhase('Executing').durationMilliseconds >= Constants.MaxExecutingInfraJobDuration) {
        return true;
      } else {
        return false;
      }
    })) {
      this.infrastructureJobsSuggestion.push(Constants.longExecutingInfraJobsSuggestion);
    };

    if(this.executingMRJobs.some(job => job.RepairTask.State === 'Preparing'))
    {
      this.infrastructureJobsSuggestion.push(Constants.executingInfraJobsSuggestion);
    }
    if (this.allPendingMRJobs.length !== 0 && this.executingMRJobs.length > 1)
    {
      this.infrastructureJobsSuggestion.push(Constants.pendingInfraJobsSuggestion);
    }
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {

    return forkJoin([
      this.data.repairCollection.refresh(messageHandler),
      this.data.restClient.getInfrastructureJobs(this.serviceId, messageHandler).pipe(map(data => this.getInfrastructureData(data)))
    ]);
  }
}
