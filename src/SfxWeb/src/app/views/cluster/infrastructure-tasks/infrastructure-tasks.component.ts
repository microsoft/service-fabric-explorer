import { Component, OnInit, Injector } from '@angular/core';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';
import { DataService } from 'src/app/services/data.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { ListColumnSetting, ListSettings, ListColumnSettingWithCustomComponent, ListColumnSettingWithUtcTime } from 'src/app/Models/ListSettings';
import { SettingsService } from 'src/app/services/settings.service';
import { InfrastructureJobViewComponent } from '../infrastructure-task-view/infrastructure-task-view.component';
import { InfrastructureJob } from 'src/app/Models/DataModels/infrastructureJob';
import { ITimelineData, EventStoreUtils } from 'src/app/Models/eventstore/timelineGenerators';
import { DataSet, DataGroup, DataItem } from 'vis-timeline';
import { InfrastructureJobCollection } from 'src/app/Models/DataModels/collections/InfrastructureJobCollection';
import { map } from 'rxjs/operators';
import { Counter, ICounterMostCommonEntry } from 'src/app/Utils/Utils';
import { ISortOrdering } from 'src/app/modules/detail-list-templates/detail-list/detail-list.component';

interface ITileListItem {
  primaryText: string;
  secondaryText: string;
  topCorner: string;
}

@Component({
  selector: 'app-infrastructure-tasks',
  templateUrl: './infrastructure-tasks.component.html',
  styleUrls: ['./infrastructure-tasks.component.scss']
})
export class InfrastructureJobsComponent extends BaseControllerDirective {
  public infrastructureJobCollection: InfrastructureJobCollection;

  longestRunning: ITileListItem[] = [];
  MostCommonActions: ICounterMostCommonEntry[] = [];

  // used for timeline
  sortedInfrastructureJobs: InfrastructureJob[] = [];
  sortedCompletedInfrastructureJobs: InfrastructureJob[] = [];

  infrastructureJobListSettings: ListSettings;
  completedInfrastructureJobListSettings: ListSettings;

  timelineData: ITimelineData;
  chartJobs: InfrastructureJob[] = [];

  // will be initially set by detail list component.
  ordering: ISortOrdering;

  constructor(private data: DataService, injector: Injector, private settings: SettingsService) {
    super(injector);
  }

  setup() {
    this.infrastructureJobCollection = this.data.infrastructureCollection;

    this.infrastructureJobListSettings = this.settings.getNewOrExistingListSettings('repair', ['raw.History.CreatedUtcTimestamp'],
      [
          new ListColumnSetting('raw.TaskId', 'Task Id'),
          new ListColumnSetting('raw.Action', 'Action', {enableFilter: true}),
          new ListColumnSetting('raw.Target.NodeNames', 'Target'),
          new ListColumnSetting('impactedNodes', 'Impact'),
          new ListColumnSetting('raw.State', 'State', {enableFilter: true}),
          new ListColumnSettingWithUtcTime('raw.History.CreatedUtcTimestamp', 'Created At'),
          new ListColumnSetting('displayDuration', 'Duration', {
            sortPropertyPaths: ['duration']
          }),
      ],
      [
        new ListColumnSettingWithCustomComponent(InfrastructureJobViewComponent,
          '',
          '',
          {
            enableFilter: false,
            colspan: -1
          })
      ],
      true,
      (item) => (Object.keys(item).length > 0),
      true);

    this.completedInfrastructureJobListSettings = this.settings.getNewOrExistingListSettings('completedRepair', ['raw.History.CreatedUtcTimestamp'],
        [
            new ListColumnSetting('raw.TaskId', 'Task Id'),
            new ListColumnSetting('raw.Action', 'Action', {enableFilter: true}),
            new ListColumnSetting('raw.Target.NodeNames', 'Target'),
            new ListColumnSetting('impactedNodes', 'Impact'),
            new ListColumnSetting('raw.ResultStatus', 'Result Status', {enableFilter: true}),
            new ListColumnSettingWithUtcTime('raw.History.CreatedUtcTimestamp', 'Created At'),
            new ListColumnSetting('displayDuration', 'Duration', {
              sortPropertyPaths: ['duration']
            }),
        ],
      [
        new ListColumnSettingWithCustomComponent(InfrastructureJobViewComponent,
          '',
          '',
          {
            enableFilter: false,
            colspan: -1
          })
      ],
      true,
      (item) => true,
      true);
  }

  /*
  use boolean to share this function with both tables
  */
  sorted(items: InfrastructureJob[], isCompletedSet: boolean = true) {
    isCompletedSet ? this.sortedCompletedInfrastructureJobs = items : this.sortedInfrastructureJobs = items;
    this.chartJobs = this.sortedCompletedInfrastructureJobs.concat(this.sortedInfrastructureJobs);
    this.generateTimeLineData(this.chartJobs);
  }

  setSortOrdering(sortInfo: ISortOrdering) {
    this.ordering = sortInfo;
  }

  generateTimeLineData(tasks: InfrastructureJob[]) {
    const items = new DataSet<DataItem>();
    const groups = new DataSet<DataGroup>();

    tasks.forEach(task => {
      items.add({
        id: task.raw.TaskId,
        content: task.raw.TaskId,
        start: task.startTime ,
        end: task.inProgress ? new Date() : new Date(task.raw.History.CompletedUtcTimestamp),
        type: 'range',
        group: 'job',
        subgroup: 'stack',
        className: task.inProgress ? 'blue' : task.raw.ResultStatus === 'Succeeded' ? 'green' : 'red',
        title: EventStoreUtils.tooltipFormat(task.raw, new Date(task.raw.History.ExecutingUtcTimestamp).toLocaleString(),
                                                       new Date(task.raw.History.CompletedUtcTimestamp).toLocaleString()),
      });
    });

    groups.add({
      id: 'job',
      content: 'Job History',
      subgroupStack: {stack: true}
    });

    this.timelineData = {
      groups,
      items,
    };
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return this.infrastructureJobCollection.refresh(messageHandler).pipe(map(() => {

      const counter = new Counter();
      this.infrastructureJobCollection.collection.forEach(task => counter.add(task.raw.Action));
      this.MostCommonActions = counter.mostCommon().slice(0, 3);

      this.longestRunning = [];

      const longRunningApprovalJob = this.infrastructureJobCollection.longRunningApprovalJob;
      if (longRunningApprovalJob) {
        this.longestRunning.push({
          primaryText: 'Approving',
          secondaryText: longRunningApprovalJob.id,
          topCorner: longRunningApprovalJob.displayDuration
        });
      }

      const longRunningExecutingManagementJob = this.infrastructureJobCollection.longestExecutingJob;
      if (longRunningExecutingManagementJob) {
        this.longestRunning.push({
          primaryText: 'Executing',
          secondaryText: longRunningExecutingManagementJob.id,
          topCorner: longRunningExecutingManagementJob.displayDuration
        });
      }
    }));
  }
}
