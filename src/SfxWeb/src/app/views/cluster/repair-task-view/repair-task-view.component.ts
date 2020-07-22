import { Component, OnInit } from '@angular/core';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { ListColumnSetting } from 'src/app/Models/ListSettings';
import { RepairTask } from 'src/app/Models/DataModels/repairTask';

@Component({
  selector: 'app-repair-task-view',
  templateUrl: './repair-task-view.component.html',
  styleUrls: ['./repair-task-view.component.scss']
})
export class RepairTaskViewComponent implements OnInit, DetailBaseComponent {
  listSetting: ListColumnSetting;
  item: RepairTask;
  copyText: string = "";
  history: any;

  constructor() { }

  ngOnInit(): void {
    console.log(this.item);
    this.history = Object.keys(this.item.raw.History).map(key => {
      return {
        key: key.replace("UtcTimestamp", ""),
        value: this.item.raw.History[key]
      }
    }).sort( (time1, time2) => {
      if(time1.value === "0001-01-01T00:00:00.000Z") {
        return -1;
      }
      return new Date(time1.value) > new Date(time2.value) ? 1 : -1;
    });

    this.copyText = JSON.stringify(this.item.raw, null, "\t");
  }

  asIsOrder(a: any, b: any): number {
    return 1;
  }

}
