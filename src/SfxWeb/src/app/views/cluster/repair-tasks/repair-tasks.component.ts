import { Component, OnInit, Injector } from '@angular/core';
import { BaseController } from 'src/app/ViewModels/BaseController';
import { DataService } from 'src/app/services/data.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { ListColumnSetting, ListSettings, ListColumnSettingWithCustomComponent } from 'src/app/Models/ListSettings';
import { SettingsService } from 'src/app/services/settings.service';
import { map } from 'rxjs/operators';
import { RepairTaskViewComponent } from '../repair-task-view/repair-task-view.component';
import { RepairTask } from 'src/app/Models/DataModels/repairTask';
import { ITimelineData, EventStoreUtils } from 'src/app/Models/eventstore/timelineGenerators';
import { DataSet, DataGroup, DataItem } from 'vis-timeline';

@Component({
  selector: 'app-repair-tasks',
  templateUrl: './repair-tasks.component.html',
  styleUrls: ['./repair-tasks.component.scss']
})
export class RepairTasksComponent extends BaseController {

  repairTasks: RepairTask[];
  completedRepairTasks: RepairTask[];

  //used for timeline
  sortedRepairTasks: RepairTask[] = [];
  sortedCompletedRepairTasks: RepairTask[] = [];

  repairTaskListSettings: ListSettings;
  completedRepairTaskListSettings: ListSettings;

  timelineData: ITimelineData;

  constructor(private data: DataService, injector: Injector, private settings: SettingsService) {
    super(injector);
   }

  setup() {
    this.repairTaskListSettings = this.settings.getNewOrExistingListSettings("repair", null,
    [
        new ListColumnSetting("raw.TaskId", "TaskId"),
        new ListColumnSetting("raw.Action", "Action", ["raw.Action"], true),
        new ListColumnSetting("raw.Target.NodeNames", "Target"),
        new ListColumnSetting("impactedNodes", "Impact"),
        new ListColumnSetting("raw.State", "State", ["raw.State"], true),
        new ListColumnSetting("createdAt", "Created at"),
    ],
    [
      new ListColumnSettingWithCustomComponent(RepairTaskViewComponent,
        "",
        "",
        [],
        false,
        -1
        )
  ],  
    true,
    (item) => (Object.keys(item).length > 0),
    true);

    this.completedRepairTaskListSettings = this.settings.getNewOrExistingListSettings("completedRepair", null,
        [
            new ListColumnSetting("raw.TaskId", "TaskId"),
            new ListColumnSetting("raw.Action", "Action", ["raw.Action"], true),
            new ListColumnSetting("raw.Target.NodeNames", "Target"),
            new ListColumnSetting("impactedNodes", "Impact"),
            new ListColumnSetting("raw.ResultStatus", "Result Status", ["raw.ResultStatus"], true),
            new ListColumnSetting("createdAt", "Created at"),
        ],
        [
          new ListColumnSettingWithCustomComponent(RepairTaskViewComponent,
            "",
            "",
            [],
            false,
            -1
            )
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
    this.generateTimeLineData(this.sortedCompletedRepairTasks.concat(this.sortedRepairTasks));
  }

  generateTimeLineData(tasks: RepairTask[]) {
    let items = new DataSet<DataItem>();
    let groups = new DataSet<DataGroup>();

    tasks.forEach(task => {
        items.add({
          id: task.raw.TaskId,
          content: task.raw.TaskId,
          start: task.startTime ,
          end: task.inProgress ? new Date() : new Date(task.raw.History.CompletedUtcTimestamp),
          type: "range",
          group: "job",
          subgroup: "stack",
          className: task.inProgress ? 'blue' : task.raw.ResultStatus === "Succeeded" ? 'green' : 'red',
          title: EventStoreUtils.tooltipFormat(task.raw, new Date(task.raw.History.ExecutingUtcTimestamp).toLocaleString(),
                                                         new Date(task.raw.History.CompletedUtcTimestamp).toLocaleString()),
        })
    })

    groups.add({
      id: "job",
      content: "Job History",
      subgroupStack: {"stack": true}
    })

    this.timelineData = {
      groups,
      items,
    }
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return this.data.restClient.getRepairTasks(messageHandler).pipe(map(data => {
      this.completedRepairTasks = [];
      this.repairTasks = [];
      data.map(json => new RepairTask(json)).forEach(task => {
        if(task.inProgress) {
          this.repairTasks.push(task);
        }else {
          this.completedRepairTasks.push(task);
        }
      })
    }))
  }
}
