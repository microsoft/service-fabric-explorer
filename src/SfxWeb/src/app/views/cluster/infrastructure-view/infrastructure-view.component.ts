import { Component, Injector, OnInit } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { InfrastructureCollection } from 'src/app/Models/DataModels/collections/infrastructureCollection';
import { RepairTaskCollection } from 'src/app/Models/DataModels/collections/RepairTaskCollection';
import { InfrastructureJob } from 'src/app/Models/DataModels/infrastructureJob';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';

@Component({
  selector: 'app-infrastructure-view',
  templateUrl: './infrastructure-view.component.html',
  styleUrls: ['./infrastructure-view.component.scss']
})
export class InfrastructureViewComponent extends BaseControllerDirective {
  public collection: InfrastructureCollection;
  public repairTaskCollection: RepairTaskCollection;

  allPendingMRJobs: InfrastructureJob[] = [];
  executingMRJobs: InfrastructureJob[] = [];
  // completedMRJobs: CompletedInfrastructureJob[] = [];

  // longestRunning: ITileListItem[] = [];
  // MostCommonActions: ICounterMostCommonEntry[] = [];

  // // used for timeline
  // sortedRepairTasks: RepairTask[] = [];
  // sortedCompletedRepairTasks: RepairTask[] = [];

  // repairTaskListSettings: ListSettings;
  // completedRepairTaskListSettings: ListSettings;

  // timelineData: ITimelineData;
  // chartJobs: RepairTask[] = [];

  // timelineGenerator: RepairTaskTimelineGenerator;

  // // will be initially set by detail list component.
  // ordering: ISortOrdering;

  constructor(private data: DataService, injector: Injector, private settings: SettingsService) {
    super(injector);
  }

  setup() {
    this.collection = this.data.infrastructureCollection;
    this.repairTaskCollection = this.data.repairCollection;
    // this.timelineGenerator = new RepairTaskTimelineGenerator();
    // this.repairTaskListSettings = this.settings.getNewOrExistingPendingRepairTaskListSettings();
    // this.completedRepairTaskListSettings = this.settings.getNewOrExistingCompletedRepairTaskListSettings();
  }

  /*
  use boolean to share this function with both tables
  */
  // sorted(items: RepairTask[], isCompletedSet: boolean = true) {
  //   isCompletedSet ? this.sortedCompletedRepairTasks = items : this.sortedRepairTasks = items;
  //   this.chartJobs = this.sortedCompletedRepairTasks.concat(this.sortedRepairTasks);
  //   this.timelineData = this.timelineGenerator.generateTimeLineData(this.chartJobs);
  // }

  // setSortOrdering(sortInfo: ISortOrdering) {
  //   this.ordering = sortInfo;
  // }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return forkJoin([
      this.collection.refresh(messageHandler),
      this.repairTaskCollection.refresh(messageHandler)
    ])
    // return this.repairTaskCollection.refresh(messageHandler).pipe(map(() => {

    //   const counter = new Counter();
    //   this.repairTaskCollection.collection.forEach(task => counter.add(task.raw.Action));
    //   this.MostCommonActions = counter.mostCommon().slice(0, 3);

    //   this.longestRunning = [];

    //   const longRunningApprovalJob = this.repairTaskCollection.longRunningApprovalJob;
    //   if (longRunningApprovalJob) {
    //     this.longestRunning.push({
    //       primaryText: 'Approving',
    //       secondaryText: longRunningApprovalJob.id,
    //       topCorner: longRunningApprovalJob.displayDuration
    //     });
    //   }

    //   const longRunningExecutingRepairJob = this.repairTaskCollection.longestExecutingJob;
    //   if (longRunningExecutingRepairJob) {
    //     this.longestRunning.push({
    //       primaryText: 'Executing',
    //       secondaryText: longRunningExecutingRepairJob.id,
    //       topCorner: longRunningExecutingRepairJob.displayDuration
    //     });
    //   }
    // }));
  }

}
