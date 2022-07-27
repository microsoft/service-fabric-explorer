import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { InfrastructureJob } from 'src/app/Models/DataModels/infrastructureJob';
import { Constants } from 'src/app/Common/Constants';
import { RepairTask } from 'src/app/Models/DataModels/repairTask';
import { ListSettings, ListColumnSetting, ListColumnSettingWithFilter, ListColumnSettingWithShorten } from 'src/app/Models/ListSettings';
import { SettingsService } from 'src/app/services/settings.service';
import { RepairTaskCollection } from 'src/app/Models/DataModels/collections/RepairTaskCollection';

@Component({
  selector: 'app-infrastructure-overview',
  templateUrl: './infrastructure-overview.component.html',
  styleUrls: ['./infrastructure-overview.component.scss']
})
export class InfrastructureOverviewComponent implements OnInit, OnChanges {
  @Input() jobs: InfrastructureJob[];
  @Input() repairCollection: RepairTaskCollection;

  allPendingMRJobs: InfrastructureJob[] = [];
  executingMRJobs: InfrastructureJob[] = [];
  completedMRJobs: InfrastructureJob[] = [];

  allPendingMRJobsList: ListSettings;
  completedMRJobsList: ListSettings;

  infrastructureJobsSuggestion: string[] = [];
  constructor(private settings: SettingsService) { }

  ngOnInit(): void {
    this.allPendingMRJobsList = this.settings.getNewOrExistingListSettings('allMRJobs', ['raw.CurrentUD'], [
      new ListColumnSetting('raw.Id', 'Job Id'),
      new ListColumnSettingWithFilter('raw.CurrentUD', 'Current UD'),
      new ListColumnSetting('raw.AcknowledgementStatus', 'Acknowledgement Status'),
      new ListColumnSetting('raw.ImpactAction', 'Impact Action'),
      new ListColumnSetting('RepairTask.TaskId', 'Repair Task'),
      new ListColumnSettingWithShorten('raw.RoleInstancesToBeImpacted', 'Target Nodes', 2),
     ]);

    this.completedMRJobsList = this.settings.getNewOrExistingListSettings('completedMRJobs', [], [
      new ListColumnSetting('raw.Id', 'Job Id'),
      new ListColumnSetting('raw.ImpactAction', 'Impact Action'),
      new ListColumnSetting('raw.RoleInstancesToBeImpacted', 'Impacted Nodes'),
    ]);
    this.infrastructureJobsSuggestion = [];
  }

  ngOnChanges(): void {
    this.executingMRJobs = this.jobs.filter(job => job.raw.JobStatus === 'Executing' && Boolean(job.raw.IsActive))
    this.allPendingMRJobs = this.jobs.filter(job => job.raw.JobStatus !== 'Completed' && !Boolean(job.raw.IsActive))
    this.completedMRJobs = this.jobs.filter(job => job.raw.JobStatus === 'Completed');
    this.infrastructureJobsSuggestion = [];

    if (this.executingMRJobs.some(job => {
      const repairTask = this.repairCollection.collection.find(rt => rt.id === job.RepairTask.TaskId);
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
}
