import { Component, OnInit, Injector } from '@angular/core';
import { BaseController } from 'src/app/ViewModels/BaseController';
import { DataService } from 'src/app/services/data.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { ListColumnSetting, ListSettings, ListColumnSettingWithCustomComponent } from 'src/app/Models/ListSettings';
import { SettingsService } from 'src/app/services/settings.service';
import { map } from 'rxjs/operators';
import { IRawRepairTask } from 'src/app/Models/RawDataTypes';
import { RepairTaskViewComponent } from '../repair-task-view/repair-task-view.component';

@Component({
  selector: 'app-repair-tasks',
  templateUrl: './repair-tasks.component.html',
  styleUrls: ['./repair-tasks.component.scss']
})
export class RepairTasksComponent extends BaseController {

  repairTasks: IRawRepairTask[];
  completedRepairTasks: IRawRepairTask[];
  repairTaskListSettings: ListSettings;
  completedRepairTaskListSettings: ListSettings;

  constructor(private data: DataService, injector: Injector, private settings: SettingsService) {
    super(injector);
   }

  setup() {
    this.repairTaskListSettings = this.settings.getNewOrExistingListSettings("repair", null,
    [
        new ListColumnSetting("TaskId", "TaskId"),
        new ListColumnSetting("Action", "Action"),
        new ListColumnSetting("Target.NodeNames", "Target"),
        new ListColumnSetting("Impact.NodeImpactList", "Impact"),
        new ListColumnSetting("State", "State"),
        new ListColumnSetting("History.CreatedUtcTimestamp", "Created at"),
    ],
    [
      new ListColumnSettingWithCustomComponent(RepairTaskViewComponent,
        "",
        ""
        )
    //   new ListColumnSetting(
    //     "",
    //     "",
    //     [],
    //     null,
    //     (item) => {
    //         let json = `${JSON.stringify(item, null, "&nbsp;")}`;
    //     return `<div style="margin-left:20px">${json.replace(new RegExp("\\n", "g"), "<br/>")}</div>`;
    //     },
    // -1)
  ],  
    true,
    (item) => (Object.keys(item).length > 0),
    true);

    this.completedRepairTaskListSettings = this.settings.getNewOrExistingListSettings("completedRepair", null,
        [
            new ListColumnSetting("TaskId", "TaskId"),
            new ListColumnSetting("Action", "Action"),
            new ListColumnSetting("Target.NodeNames", "Target"),
            new ListColumnSetting("Impact.NodeImpactList", "Impact"),
            new ListColumnSetting("ResultStatus", "Result Status"),
            // new ListColumnSetting("duration", "Duration"),
            new ListColumnSetting("History.CreatedUtcTimestamp", "Created at"),
        ],
        [
          new ListColumnSettingWithCustomComponent(RepairTaskViewComponent,
            "",
            ""
            )
        //   new ListColumnSetting(
        //     "",
        //     "",
        //     [],
        //     null,
        //     (item) => {
        //         let json = `${JSON.stringify(item, null, "&nbsp;")}`;
        //     return `<div style="margin-left:20px">${json.replace(new RegExp("\\n", "g"), "<br/>")}</div>`;
        //     },
        // -1)
      ],  
        true,
        (item) => (Object.keys(item).length > 0),
        true);
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return this.data.restClient.getRepairTasks("", 127, "", messageHandler).pipe(map(data => {
      console.log(data);
      // const repairTasks = data.data.map(item => new RepairTask(item));
      this.completedRepairTasks = data.filter(task => task.State === 64);
      this.repairTasks = data.filter(task => task.State !== 64)
    }))
  }
}
