import { Component, OnInit } from '@angular/core';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { ListColumnSetting } from 'src/app/Models/ListSettings';
import { IRawRepairTask } from 'src/app/Models/RawDataTypes';

@Component({
  selector: 'app-repair-task-view',
  templateUrl: './repair-task-view.component.html',
  styleUrls: ['./repair-task-view.component.scss']
})
export class RepairTaskViewComponent implements OnInit, DetailBaseComponent {
  listSetting: ListColumnSetting;
  item: IRawRepairTask;

  history: any;

  constructor() { }

  ngOnInit(): void {
    console.log(this.item.History);
    this.history = this.item.History;
  }

  asIsOrder(a: any, b: any): number {
    return 1;
  }

}
