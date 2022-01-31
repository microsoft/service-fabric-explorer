import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { InfrastructureJob } from 'src/app/Models/DataModels/infrastructureJob';
import { RepairTask } from 'src/app/Models/DataModels/repairTask';
import { ListColumnSetting, ListColumnSettingWithShorten, ListSettings } from 'src/app/Models/ListSettings';
import { IRawInfrastructureJob, IRawInfraRepairTask, IRawRoleInstanceImpact, InfraRepairTask } from 'src/app/Models/RawDataTypes';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { IProgressStatus } from 'src/app/shared/component/phase-diagram/phase-diagram.component';
import { IEssentialListItem } from '../../charts/essential-health-tile/essential-health-tile.component';

@Component({
  selector: 'app-infrastructure-job-tile',
  templateUrl: './infrastructure-job-tile.component.html',
  styleUrls: ['./infrastructure-job-tile.component.scss']
})
export class InfrastructureJobTileComponent implements OnChanges {

  @Input() job: InfrastructureJob;

  essentialItems: IEssentialListItem[] = [];
  public progress: IProgressStatus[] = [];
  public index = -1;
  impactingNodes: ListSettings;

  repairJobs: ListSettings;
  repairTask: RepairTask;

  constructor(public settings: SettingsService,
              public dataService: DataService) { }

  ngOnInit()  {
    this.impactingNodes = this.settings.getNewOrExistingListSettings('impactingNodes', [], [
      new ListColumnSetting('Name', 'Name'),
      new ListColumnSetting('UD', 'UD'),
      new ListColumnSettingWithShorten('ImpactTypes', 'Impact Types', 3),
    ]);

    this.repairJobs = this.settings.getNewOrExistingPendingRepairTaskListSettings();
  }


  ngOnChanges(): void {
    this.essentialItems = [
      {
        descriptionName: 'Current UD',
        copyTextValue: this.job.raw.CurrentUD,
        displayText: this.job.raw.CurrentUD,
      },
      {
        descriptionName: 'Ack Status',
        copyTextValue: this.job.raw.AcknowledgementStatus,
        displayText: this.job.raw.AcknowledgementStatus,
      },
      {
        descriptionName: 'Impact Action',
        copyTextValue: this.job.VmImpact.join(","),
        displayText: this.job.VmImpact.join(","),
      },
    ];

    const phaseMap = {
      Preparing: 1,
      Executing: 2,
      Completed: 3
    };

    this.index = phaseMap[this.job.raw.JobStatus];

    this.progress = [
      {
        name: 'Preparing',
      },
      {
        name: 'Executing',
      },
      {
        name: 'Completed',
      }
    ];

    this.dataService.getRepairJobById(this.job.RepairTask.TaskId).subscribe(job => {
      this.repairTask = job;
    });
  }
}
