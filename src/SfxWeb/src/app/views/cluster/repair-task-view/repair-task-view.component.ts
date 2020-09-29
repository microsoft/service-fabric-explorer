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
  copyText = '';
  history: any;

  constructor() { }

  ngOnInit(): void {
    this.copyText = JSON.stringify(this.item.raw, null, '\t');
  }

  asIsOrder(a: any, b: any): number {
    return 1;
  }

}
