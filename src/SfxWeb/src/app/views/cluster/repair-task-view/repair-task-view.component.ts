import { Component, OnDestroy, OnInit } from '@angular/core';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { ListColumnSetting } from 'src/app/Models/ListSettings';
import { IRepairTaskPhase, RepairTask } from 'src/app/Models/DataModels/repairTask';
import { DataService } from 'src/app/services/data.service';
import { forkJoin } from 'rxjs';
import { RefreshService } from 'src/app/services/refresh.service';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'app-repair-task-view',
  templateUrl: './repair-task-view.component.html',
  styleUrls: ['./repair-task-view.component.scss']
})
export class RepairTaskViewComponent implements OnInit, DetailBaseComponent, OnDestroy {
  listSetting: ListColumnSetting;
  item: RepairTask;
  copyText = '';
  history: any;
  nodes = [];
  constructor(public dataService: DataService, private refreshService: RefreshService) { }

  ngOnInit(): void {
    this.copyText = JSON.stringify(this.item.raw, null, '\t');

    this.updateNodesList().subscribe();

    this.refreshService.insertRefreshSubject(this.item.id, () => this.updateNodesList());
  }

  ngOnDestroy() {
    this.refreshService.removeRefreshSubject(this.item.id);
  }

  asIsOrder(a: any, b: any): number {
    return 1;
  }

  updateNodesList() {
    return forkJoin(Array.from(new Set(this.item.raw.Target.NodeNames.concat(this.item.impactedNodes))).map(id => {
      return this.dataService.getNode(id, true).pipe(catchError(err => null));
    })).pipe(map(data => {
      this.nodes = data.filter(node => node);
    }));
  }
}
