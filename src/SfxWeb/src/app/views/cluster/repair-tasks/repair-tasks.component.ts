import { Component, OnInit, Injector } from '@angular/core';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';
import { DataService } from 'src/app/services/data.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { ListSettings } from 'src/app/Models/ListSettings';
import { SettingsService } from 'src/app/services/settings.service';
import { RepairTask } from 'src/app/Models/DataModels/repairTask';
import { ITimelineData, RepairTaskTimelineGenerator } from 'src/app/Models/eventstore/timelineGenerators';
import { RepairTaskCollection } from 'src/app/Models/DataModels/collections/RepairTaskCollection';
import { map } from 'rxjs/operators';
import { Counter, ICounterMostCommonEntry } from 'src/app/Utils/Utils';
import { ISortOrdering } from 'src/app/modules/detail-list-templates/detail-list/detail-list.component';

interface ITileListItem {
  primaryText: string;
  secondaryText: string;
  topCorner: string;
}

@Component({
  selector: 'app-repair-tasks',
  templateUrl: './repair-tasks.component.html',
  styleUrls: ['./repair-tasks.component.scss']
})
export class RepairTasksComponent extends BaseControllerDirective {
  public repairTaskCollection: RepairTaskCollection;

  longestRunning: ITileListItem[] = [];
  MostCommonActions: ICounterMostCommonEntry[] = [];

  // used for timeline
  sortedRepairTasks: RepairTask[] = [];
  sortedCompletedRepairTasks: RepairTask[] = [];

  repairTaskListSettings: ListSettings;
  completedRepairTaskListSettings: ListSettings;

  timelineData: ITimelineData;
  chartJobs: RepairTask[] = [];

  timelineGenerator: RepairTaskTimelineGenerator;

  // will be initially set by detail list component.
  ordering: ISortOrdering;

  constructor(private data: DataService, injector: Injector, private settings: SettingsService) {
    super(injector);
  }

  setup() {
    this.repairTaskCollection = this.data.repairCollection;
    this.timelineGenerator = new RepairTaskTimelineGenerator();
    this.repairTaskListSettings = this.settings.getNewOrExistingPendingRepairTaskListSettings();
    this.completedRepairTaskListSettings = this.settings.getNewOrExistingCompletedRepairTaskListSettings();
  }

  /*
  use boolean to share this function with both tables
  */
  sorted(items: RepairTask[], isCompletedSet: boolean = true) {
    isCompletedSet ? this.sortedCompletedRepairTasks = items : this.sortedRepairTasks = items;
    this.chartJobs = this.sortedCompletedRepairTasks.concat(this.sortedRepairTasks);
    this.timelineData = this.timelineGenerator.generateTimeLineData(this.chartJobs);
  }

  setSortOrdering(sortInfo: ISortOrdering) {
    this.ordering = sortInfo;
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return this.repairTaskCollection.refresh(messageHandler).pipe(map(() => {

      const counter = new Counter();
      this.repairTaskCollection.collection.forEach(task => counter.add(task.raw.Action));
      this.MostCommonActions = counter.mostCommon().slice(0, 3);

      this.longestRunning = [];

      const longRunningApprovalJob = this.repairTaskCollection.longRunningApprovalJob;
      if (longRunningApprovalJob) {
        this.longestRunning.push({
          primaryText: 'Approving',
          secondaryText: longRunningApprovalJob.id,
          topCorner: longRunningApprovalJob.displayDuration
        });
      }

      const longRunningExecutingRepairJob = this.repairTaskCollection.longestExecutingJob;
      if (longRunningExecutingRepairJob) {
        this.longestRunning.push({
          primaryText: 'Executing',
          secondaryText: longRunningExecutingRepairJob.id,
          topCorner: longRunningExecutingRepairJob.displayDuration
        });
      }
    }));
  }
}
