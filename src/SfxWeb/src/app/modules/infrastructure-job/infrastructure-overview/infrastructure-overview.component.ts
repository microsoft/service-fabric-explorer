import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { InfrastructureJob } from 'src/app/Models/DataModels/infrastructureJob';
import { Constants } from 'src/app/Common/Constants';
import { RepairTask } from 'src/app/Models/DataModels/repairTask';
import { ListSettings, ListColumnSetting, ListColumnSettingWithFilter, ListColumnSettingWithShorten } from 'src/app/Models/ListSettings';
import { SettingsService } from 'src/app/services/settings.service';
import { RepairTaskCollection } from 'src/app/Models/DataModels/collections/RepairTaskCollection';
import { DataService } from 'src/app/services/data.service';
import { InfrastructureCollectionItem } from 'src/app/Models/DataModels/collections/infrastructureCollection';

@Component({
  selector: 'app-infrastructure-overview',
  templateUrl: './infrastructure-overview.component.html',
  styleUrls: ['./infrastructure-overview.component.scss']
})
export class InfrastructureOverviewComponent implements OnInit, OnChanges {
  @Input() collection: InfrastructureCollectionItem;
  @Input() jobs: InfrastructureJob[];
  @Input() repairCollection: RepairTaskCollection;

  allPendingMRJobsList: ListSettings;
  completedMRJobsList: ListSettings;

  infrastructureJobsSuggestion: string[] = [];
  constructor(private settings: SettingsService, private data: DataService) { }

  ngOnInit(): void {
    this.allPendingMRJobsList = this.settings.getNewOrExistingListSettings('allMRJobs', ['raw.CurrentUD'], [
      new ListColumnSetting('raw.Id', 'Job Id'),
      new ListColumnSettingWithFilter('raw.CurrentUD', 'Current UD'),
      new ListColumnSetting('raw.AcknowledgementStatus', 'Acknowledgement Status'),
      new ListColumnSetting('raw.ImpactAction', 'Impact Action'),
      new ListColumnSetting('RepairTask.TaskId', 'Repair Task'),
      new ListColumnSettingWithShorten('raw.RoleInstancesToBeImpacted', 'Target Nodes', 2),
      new ListColumnSetting('raw.IsThrottled', 'Throttled'),
    ]);

    this.data.versionCheck("9.1").then(valid => {
      if (valid && !this.allPendingMRJobsList.columnSettings.some(col => col.displayName === "Throttled")) {
        this.allPendingMRJobsList.columnSettings.push(new ListColumnSetting('raw.IsThrottled', 'Throttled'))
      }
    })

    this.completedMRJobsList = this.settings.getNewOrExistingListSettings('completedMRJobs', [], [
      new ListColumnSetting('raw.Id', 'Job Id'),
      new ListColumnSetting('raw.ImpactAction', 'Impact Action'),
      new ListColumnSetting('raw.RoleInstancesToBeImpacted', 'Impacted Nodes'),
    ]);
    this.infrastructureJobsSuggestion = [];
  }

  ngOnChanges(): void {
    this.infrastructureJobsSuggestion = [];

    if (this.collection.executingMRJobs.some(job => {
      const repairTask = this.repairCollection.collection.find(rt => rt.id === job.RepairTask.TaskId);
      if (repairTask && repairTask.raw.State === RepairTask.ExecutingStatus && repairTask.getPhase('Executing').durationMilliseconds >= Constants.MaxExecutingInfraJobDuration) {
        return true;
      } else {
        return false;
      }
    })) {
      this.infrastructureJobsSuggestion.push(Constants.longExecutingInfraJobsSuggestion);
    };

    if(this.collection.executingMRJobs.some(job => job.RepairTask.State === 'Preparing'))
    {
      this.infrastructureJobsSuggestion.push(Constants.executingInfraJobsSuggestion);
    }
    if (this.collection.allPendingMRJobs.length !== 0 && this.collection.executingMRJobs.length > 1)
    {
      this.infrastructureJobsSuggestion.push(Constants.pendingInfraJobsSuggestion);
    }
  }
}
