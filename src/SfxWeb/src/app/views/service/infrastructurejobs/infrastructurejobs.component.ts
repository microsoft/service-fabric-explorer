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

@Component({
  selector: 'app-infrastructurejobs',
  templateUrl: './infrastructurejobs.component.html',
  styleUrls: ['./infrastructurejobs.component.scss']
})
export class InfrastructureJobsComponent extends ServiceBaseControllerDirective {

  jobs = [];

  allPendingMRJobs: InfrastructureJob[] = [];
  executingMRJobs: InfrastructureJob[] = [];
  completedMRJobs: CompletedInfrastructureJob[] = [];
  allPendingMRJobsList: ListSettings;
  executingMRJobsList: ListSettings;
  completedMRJobsList: ListSettings;
  executingInfraJobsSuggestion: string;
  pendingInfraJobsSuggestion: string;

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
     ]);

    this.executingMRJobsList = this.settings.getNewOrExistingListSettings('executingMRJobs', ['raw.IsActive'], [
      new ListColumnSetting('raw.Id', 'Job Id'),
      new ListColumnSettingWithFilter('raw.CurrentUD', 'Current UD'),
      new ListColumnSetting('raw.AcknowledgementStatus', 'Acknowledgement Status'),
      new ListColumnSetting('raw.ImpactAction', 'Impact Action'),
      new ListColumnSetting('RepairTask.TaskId', 'Repair Task'),
      new ListColumnSetting('RepairTask.State', 'Repair Task State'),
      new ListColumnSettingWithShorten('NodeImpact', 'Node Impact', 2),
      new ListColumnSettingWithShorten('VmImpact', 'VM Impact', 2)
     ]);

    this.completedMRJobsList = this.settings.getNewOrExistingListSettings('completedMRJobs', [], [
      new ListColumnSetting('raw.Id', 'Job Id'),
      new ListColumnSetting('raw.ImpactAction', 'Impact Action'),
      new ListColumnSetting('raw.RoleInstancesToBeImpacted', 'Impacted Nodes'),
    ]);

    this.pendingInfraJobsSuggestion = Constants.pendingInfraJobsSuggestion;
    this.executingInfraJobsSuggestion = Constants.executingInfraJobsSuggestion;
  }

  getInfrastructureData(mrJobdata: IRawInfrastructureJob[]): void {
    const dateRef = new Date();

    this.jobs = mrJobdata;

    this.executingMRJobs = mrJobdata.filter(job => job.JobStatus === 'Executing' && Boolean(job.IsActive)).map(rawMrJob => new InfrastructureJob(this.data, rawMrJob, dateRef));
    this.allPendingMRJobs = mrJobdata.filter(job => job.JobStatus !== 'Completed' && !Boolean(job.IsActive)).map(rawMrJob => new InfrastructureJob(this.data, rawMrJob, dateRef));
    this.completedMRJobs = mrJobdata.filter(job => job.JobStatus === 'Completed').map(rawMrJob => new CompletedInfrastructureJob(this.data, rawMrJob, dateRef));

    this.executingInfraJobsSuggestion  = this.executingMRJobs.some(job => job.RepairTask.State === 'Preparing') ? Constants.executingInfraJobsSuggestion : '' ;
    this.pendingInfraJobsSuggestion = this.pendingInfraJobsSuggestion.length !== 0 && this.executingMRJobs.length > 0 ? Constants.pendingInfraJobsSuggestion : '' ;
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {

    return forkJoin([
      this.data.repairCollection.refresh(messageHandler),
      this.data.restClient.getInfrastructureJobs(this.serviceId, messageHandler).pipe(map(data => this.getInfrastructureData(data)))
    ]);
  }
}
