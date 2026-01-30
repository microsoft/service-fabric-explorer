// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, OnDestroy, OnInit } from '@angular/core';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { ListColumnSetting } from 'src/app/Models/ListSettings';
import { RepairTask } from 'src/app/Models/DataModels/repairTask';
import { DataService } from 'src/app/services/data.service';
import { forkJoin, of, Subscription } from 'rxjs';
import { RefreshService } from 'src/app/services/refresh.service';
import { catchError, map } from 'rxjs/operators';
import { IEssentialListItem } from '../../charts/essential-health-tile/essential-health-tile.component';
import { IRawNodeRepairTargetDescription } from 'src/app/Models/RawDataTypes';

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

  healthCheckConfigs: IEssentialListItem[] = [];

  constructor(public dataService: DataService, private refreshService: RefreshService) { }

  ngOnInit(): void {
    this.copyText = JSON.stringify(this.item.raw, null, '\t');

    this.subs.add(this.updateNodesList().subscribe());

    this.subs.add(this.refreshService.refreshSubject.subscribe(() => this.updateNodesList().subscribe()));

    try {
      this.healthCheckConfigs = [
        {
          descriptionName: "Perform Preparing Health Check",
          displayText: this.item.raw.PerformPreparingHealthCheck ? "Yes": "No",
          copyTextValue: this.item.raw.PerformPreparingHealthCheck ? "Yes": "No"
        },
        {
          descriptionName: "Perform Restoring Health Check",
          displayText: this.item.raw.PerformRestoringHealthCheck ? "Yes": "No",
          copyTextValue: this.item.raw.PerformRestoringHealthCheck ? "Yes": "No"
        }
      ]
    } catch(e) {
      this.healthCheckConfigs = [];
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  asIsOrder(a: any, b: any): number {
    return 1;
  }

  updateNodesList() {
    const targetNodeNames: string[] = (this.item.raw.Target && this.item.raw.Target.Kind === 'Node' && Array.isArray((this.item.raw.Target as IRawNodeRepairTargetDescription).NodeNames))
      ? (this.item.raw.Target as IRawNodeRepairTargetDescription).NodeNames
      : [];

    const nodeIds = Array.from(new Set<string>([...targetNodeNames, ...this.item.impactedNodes]));

    return forkJoin(nodeIds.map(id => {
      return this.dataService.getNode(id, true).pipe(catchError(err => of(null)));
    })).pipe(map(data => {
      this.nodes = data.filter(node => node);
    }));
  }
}
