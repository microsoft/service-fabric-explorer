import { Component, OnInit } from '@angular/core';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { ListColumnSetting } from 'src/app/Models/ListSettings';
import { RepairTask } from 'src/app/Models/DataModels/repairTask';
import { DataService } from 'src/app/services/data.service';
import { forkJoin } from 'rxjs';

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
  nodes = [];
  constructor(public dataService: DataService) { }

  ngOnInit(): void {
    this.copyText = JSON.stringify(this.item.raw, null, '\t');
  
    console.log("test")
    forkJoin(Array.from(new Set(this.item.raw.Target.NodeNames.concat(this.item.impactedNodes))).map(id => {
      return this.dataService.getNode(id);
    })).subscribe(data => {
      this.nodes = data;
      console.log(data);
    })
  }

  asIsOrder(a: any, b: any): number {
    return 1;
  }

}
