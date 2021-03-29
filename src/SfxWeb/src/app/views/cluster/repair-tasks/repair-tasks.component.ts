import { Component, OnInit, Injector } from '@angular/core';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';
import { DataService } from 'src/app/services/data.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable, of } from 'rxjs';
import { ListColumnSetting, ListSettings, ListColumnSettingWithCustomComponent, ListColumnSettingWithUtcTime } from 'src/app/Models/ListSettings';
import { SettingsService } from 'src/app/services/settings.service';
import { RepairTaskViewComponent } from '../repair-task-view/repair-task-view.component';
import { RepairTask } from 'src/app/Models/DataModels/repairTask';
import { ITimelineData, EventStoreUtils } from 'src/app/Models/eventstore/timelineGenerators';
import { DataSet, DataGroup, DataItem } from 'vis-timeline';
import { RepairTaskCollection } from 'src/app/Models/DataModels/collections/RepairTaskCollection';
import { Chart, Options, chart } from 'highcharts';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { map } from 'rxjs/operators';
import { Counter, ICounterMostCommonEntry } from 'src/app/Utils/Utils';

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

  private chart: Chart;
  orderedJobs: RepairTask[] = [];
  fontColor = {
    color: '#fff'
  };
  constructor(private data: DataService, injector: Injector, private settings: SettingsService) {
    super(injector);
  }

  setup() {
    const options: Options = {
      chart: {
        type:'area',
        zoomType: 'x',
        backgroundColor: '#191919'
      },
      title: {
        text: '',
        style: this.fontColor
    },

    subtitle: {
      style: this.fontColor,
      text: document.ontouchstart === undefined ?
          'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
    },
    yAxis: {
        title: {
            text: 'Duration',
            style: this.fontColor
        },
        lineColor: '#fff',
        labels: {
          style: this.fontColor,
          formatter: function() { return TimeUtils.getDuration(this.value) }
        },
        
    },

    xAxis: {
        lineColor: '#fff',
        labels: {
          style: this.fontColor
        }
    },

    legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'middle',
        itemStyle: {
          color: this.fontColor.color
        }
    },
    tooltip: {
      headerFormat: '<b>{series.name}</b><br />',
      formatter: (() => { let bind = this; return function () { 
        const task = bind.sortedCompletedRepairTasks.concat(bind.sortedRepairTasks)[this.point.category];
        return `Job ${task.id} <br> ${this.point.series.name} : ${task.getHistoryPhase(this.point.series.name).duration} <br> Total Duration :  ${task.displayDuration}`; } 
      })()
    },
    plotOptions: {
      area: {
        stacking: 'normal',

      }
    },
    rangeSelector: {
      verticalAlign: 'bottom',
    },
      series: [
        {
          type: 'area',
          name: 'Restoring',
          color: 'purple',
          data: []
        },
        {
          type: 'area',
          name: 'Executing',
          color: '#7FBA00',
          data: []
        },
        {
          type: 'area',
          name: 'Preparing',
          color: '#0075c9',
          data: []
        },
      ]
    }
    this.chart = chart('container', options);



    this.repairTaskCollection = this.data.repairCollection;

    this.repairTaskListSettings = this.settings.getNewOrExistingListSettings('repair', null,
      [
          new ListColumnSetting('raw.TaskId', 'TaskId'),
          new ListColumnSetting('raw.Action', 'Action', {enableFilter: true}),
          new ListColumnSetting('raw.Target.NodeNames', 'Target'),
          new ListColumnSetting('impactedNodes', 'Impact'),
          new ListColumnSetting('raw.State', 'State', {enableFilter: true}),
          new ListColumnSettingWithUtcTime('raw.History.CreatedUtcTimestamp', 'Created at'),
          new ListColumnSetting('displayDuration', 'Duration', {
            sortPropertyPaths: ['duration']
          }),
      ],
      [
        new ListColumnSettingWithCustomComponent(RepairTaskViewComponent,
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

    this.completedRepairTaskListSettings = this.settings.getNewOrExistingListSettings('completedRepair', null,
        [
            new ListColumnSetting('raw.TaskId', 'TaskId'),
            new ListColumnSetting('raw.Action', 'Action', {enableFilter: true}),
            new ListColumnSetting('raw.Target.NodeNames', 'Target'),
            new ListColumnSetting('impactedNodes', 'Impact'),
            new ListColumnSetting('raw.ResultStatus', 'Result Status', {enableFilter: true}),
            new ListColumnSettingWithUtcTime('raw.History.CreatedUtcTimestamp', 'Created at'),
            new ListColumnSetting('displayDuration', 'Duration', {
              sortPropertyPaths: ['duration']
            }),
        ],
      [
        new ListColumnSettingWithCustomComponent(RepairTaskViewComponent,
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
  sorted(items: RepairTask[], isCompletedSet: boolean = true) {
    isCompletedSet ? this.sortedCompletedRepairTasks = items : this.sortedRepairTasks = items;
    const jobs = this.sortedCompletedRepairTasks.concat(this.sortedRepairTasks);
    this.generateTimeLineData(jobs);
    this.setGraph(jobs)
  }

  generateTimeLineData(tasks: RepairTask[]) {
    const items = new DataSet<DataItem>();
    const groups = new DataSet<DataGroup>();

    tasks.forEach(task => {
      items.add({
        id: task.raw.TaskId,
        content: task.raw.TaskId,
        start: task.startTime,
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
      subgroupStack: { stack: true }
    });

    this.timelineData = {
      groups,
      items,
    };
  }

  setGraph(repairTasks: RepairTask[]) {
    try {
      if (this.chart) {
        this.chart.series[2].setData(repairTasks.map(task => task.getHistoryPhase('Preparing').durationMilliseconds))
        this.chart.series[1].setData(repairTasks.map(task => task.getHistoryPhase('Executing')?.durationMilliseconds || 0))
        this.chart.series[0].setData(repairTasks.map(task => task.getHistoryPhase('Restoring').durationMilliseconds))
      }
    } catch(e) {
      console.log(e)
    }
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
