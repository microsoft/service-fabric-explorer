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
  allRepairTasks: RepairTask[];
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
            new ListColumnSetting("raw.Action", "Action"),
            new ListColumnSetting("raw.Target.NodeNames", "Target"),
            new ListColumnSetting("impactedNodes", "Impact"),
            new ListColumnSetting("raw.ResultStatus", "Result Status"),
            // new ListColumnSetting("duration", "Duration"),
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

  generateTimeLineData() {
    let items = new DataSet<DataItem>();
    let groups = new DataSet<DataGroup>();
    let groupNames = new Set<string>();

    this.allRepairTasks.forEach(task => {
      if(task.jobId) { //task.raw.Target.NodeNames
      //   task.raw.Target.NodeNames.forEach(node => {
        const t= {
          id: task.raw.TaskId, //node,
          content: task.raw.TaskId,
          start: task.startTime ,
          end: task.inProgress ? new Date() : TimeUtils.windowsFileTime(task.raw.History.CompletedUtcTimestamp),
          type: "range",
          group: "job", //task.jobId,   //node,
          subgroup: "stack",
          className: task.inProgress ? 'blue' : +task.raw.ResultStatus === 1 ? 'green' : 'red',
          title: EventStoreUtils.tooltipFormat(task.raw, TimeUtils.windowsFileTime(task.raw.History.ExecutingUtcTimestamp).toLocaleString(), TimeUtils.windowsFileTime(task.raw.History.CompletedUtcTimestamp).toLocaleString()),
        }    
        items.add(t)
        if(task.inProgress) {
          console.log(t)
        }
  
        //  if(!groupNames.has(task.jobId)){
        //     groups.add({
        //       id: task.jobId,
        //       content: task.jobId,
        //       subgroupStack: {"stack": true}
        //     })
        //     groupNames.add(task.jobId)
        //   }

        //   if(!groupNames.has(node)){
        //     groups.add({
        //       id: node,
        //       content: node,
        //       subgroupStack: {"stack": true}
        //     })
        //     groupNames.add(node)
        //   }
        // })
      }
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
    return this.data.restClient.getRepairTasks("", 127, "", messageHandler).pipe(map(data => {
      this.allRepairTasks = [];
      this.completedRepairTasks = [];
      this.repairTasks = [];
      data.map(json => new RepairTask(json)).forEach(task => {
        if(task.inProgress) {
          this.repairTasks.push(task);
        }else {
          this.completedRepairTasks.push(task);
        }

        this.allRepairTasks.push(task);
      })
      console.log(this.completedRepairTasks);
      this.generateTimeLineData();
    }))
  }
}
