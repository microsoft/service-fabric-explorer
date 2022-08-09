import { Component, OnDestroy, OnInit } from '@angular/core';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { ListColumnSetting } from 'src/app/Models/ListSettings';
import { IRepairTaskPhase, RepairTask } from 'src/app/Models/DataModels/repairTask';
import { DataService } from 'src/app/services/data.service';
import { forkJoin, of, Subscription } from 'rxjs';
import { RefreshService } from 'src/app/services/refresh.service';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'app-repair-task-view',
  templateUrl: './repair-task-view.component.html',
  styleUrls: ['./repair-task-view.component.scss']
})
export class RepairTaskViewComponent implements OnInit, DetailBaseComponent, OnDestroy {
  phaseTooLongDuration = 1000 * 60 * 20;
  listSetting: ListColumnSetting;
  item: RepairTask;
  copyText = '';
  nodes = [];
  subs: Subscription = new Subscription();
  stuckJobText = "";

  constructor(public dataService: DataService, private refreshService: RefreshService) { }

  ngOnInit(): void {
    this.copyText = JSON.stringify(this.item.raw, null, '\t');

    this.subs.add(this.updateNodesList().subscribe());

    if(this.item.raw.State === "Restoring") {
      this.checkLongRunning(this.item.raw.State)
    }else if(this.item.raw.State === "Preparing") {
      this.checkLongRunning(this.item.raw.State)
    }

    this.subs.add(this.refreshService.refreshSubject.subscribe(() => this.updateNodesList().subscribe()));
  }

  checkLongRunning(state: string) {
    const preparingPhase = this.item.getHistoryPhase(state);
    const currentPhase = preparingPhase.phases[preparingPhase.currentPhase - 1];

    if (currentPhase.name === `${state} Health Check Start` &&
      currentPhase.durationMilliseconds > this.phaseTooLongDuration) {
      this.stuckJobText = `This job appears to potentially be stuck in the cluster health check. This check will not pass until the overall cluster health is reporting as Healthy.`
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  asIsOrder(a: any, b: any): number {
    return 1;
  }

  updateNodesList() {
    return forkJoin(Array.from(new Set(this.item.raw.Target.NodeNames.concat(this.item.impactedNodes))).map(id => {
      return this.dataService.getNode(id, true).pipe(catchError(err => of(null)));
    })).pipe(map(data => {
      this.nodes = data.filter(node => node);
    }));
  }
}
