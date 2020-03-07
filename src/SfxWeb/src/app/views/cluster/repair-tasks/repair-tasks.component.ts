import { Component, OnInit, Injector } from '@angular/core';
import { BaseController } from 'src/app/ViewModels/BaseController';
import { DataService } from 'src/app/services/data.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { ListColumnSetting, ListSettings, ListColumnSettingWithCustomComponent } from 'src/app/Models/ListSettings';
import { SettingsService } from 'src/app/services/settings.service';
import { map } from 'rxjs/operators';
import { RepairTaskViewComponent } from '../repair-task-view/repair-task-view.component';
import { RepairTask, RepairTaskStateFilter } from 'src/app/Models/DataModels/repairTask';
import { ITimelineData, EventStoreUtils } from 'src/app/Models/eventstore/timelineGenerators';
import { DataSet, DataGroup, DataItem } from 'vis-timeline';
import { TimeUtils } from 'src/app/Utils/TimeUtils';

@Component({
  selector: 'app-repair-tasks',
  templateUrl: './repair-tasks.component.html',
  styleUrls: ['./repair-tasks.component.scss']
})
export class RepairTasksComponent extends BaseController {

  repairTasks: RepairTask[];
  completedRepairTasks: RepairTask[];
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
        new ListColumnSetting("raw.Action", "Action"),
        new ListColumnSetting("raw.Target.NodeNames", "Target"),
        new ListColumnSetting("raw.Impact.NodeImpactList", "Impact"),
        new ListColumnSetting("state", "State"),
        new ListColumnSetting("raw.History.CreatedUtcTimestamp", "Created at"),
    ],
    [
      new ListColumnSettingWithCustomComponent(RepairTaskViewComponent,
        "",
        ""
        )
  ],  
    true,
    (item) => (Object.keys(item).length > 0),
    true);

    this.completedRepairTaskListSettings = this.settings.getNewOrExistingListSettings("completedRepair", null,
        [
            new ListColumnSetting("raw.TaskId", "TaskId"),
            new ListColumnSetting("raw.Action", "Action"),
            new ListColumnSetting("raw.Target.NodeNames", "Target"),
            new ListColumnSetting("impactedNodes", "Impact"),
            new ListColumnSetting("raw.ResultStatus", "Result Status"),
            // new ListColumnSetting("duration", "Duration"),
            new ListColumnSetting("raw.History.CreatedUtcTimestamp", "Created at"),
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

  generateTimeLineData() {
    let items = new DataSet<DataItem>();
    let groups = new DataSet<DataGroup>();
    let groupNames = new Set<string>();

    this.completedRepairTasks.forEach(task => {
      console.log(task)
      if(task.raw.Target.NodeNames) {
        task.raw.Target.NodeNames.forEach(node => {
          items.add({
            id: task.raw.TaskId + node,
            content: task.raw.TaskId,
            start: TimeUtils.ticksToISO(task.raw.History.ExecutingUtcTimestamp),
            end: TimeUtils.ticksToISO(task.raw.History.CompletedUtcTimestamp),
            type: "range",
            group: node,
            subgroup: "stack",
            title: EventStoreUtils.tooltipFormat(task.raw, TimeUtils.ticksToISO(task.raw.History.ExecutingUtcTimestamp)),
          })
          console.log(TimeUtils.ticksToISO(task.raw.History.ExecutingUtcTimestamp))
  
          if(!groupNames.has(node)){
            groups.add({
              id: node,
              content: node,
              subgroupStack: {"stack": true}
            })
            groupNames.add(node)
          }
        })
      }
    })

    this.timelineData = {
      groups,
      items,
    }
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return this.data.restClient.getRepairTasks("", 127, "", messageHandler).pipe(map(data => {
      this.completedRepairTasks = [];
      this.repairTasks = [];
      data.map(json => new RepairTask(json)).forEach(task => {
        if(task.raw.State === RepairTaskStateFilter.Completed) {
          this.completedRepairTasks.push(task);
        }else {
          this.repairTasks.push(task);
        }
      })
      console.log(this.completedRepairTasks);
      this.generateTimeLineData();
    }))
  }
}
