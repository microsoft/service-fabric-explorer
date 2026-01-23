// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { IRawNodeUpgradeProgress } from 'src/app/Models/RawDataTypes';
import { IProgressStatus } from 'src/app/shared/component/phase-diagram/phase-diagram.component';


// PreUpgradeSafetyCheck - The upgrade has not started yet due to pending safety checks. The value is 1
// Upgrading - The upgrade is in progress. The value is 2
// PostUpgradeSafetyCheck - The upgrade has completed and post upgrade safety checks are being performed. The value is 3

@Component({
  selector: 'app-node-progress',
  templateUrl: './node-progress.component.html',
  styleUrls: ['./node-progress.component.scss']
})
export class NodeProgressComponent implements OnChanges {
  @Input() failed = false;
  @Input() node: IRawNodeUpgradeProgress;

  public progress: IProgressStatus[] = [];
  public index = -1;

  constructor() { }

  ngOnChanges(): void {
    const phaseMap = {
      PreUpgradeSafetyCheck: 1,
      Upgrading: 2,
      PostUpgradeSafetyCheck: 3
    };

    this.index = phaseMap[this.node.UpgradePhase];

    // given the upgrading and post upgrade safety check phases refer to completed state
    // set the index 1 further to consider them completed effectively
    if (this.index > 1 && !this.failed) {
      this.index ++;
    }

    this.progress = [
      {
        name: 'PreUpgrade SafetyCheck',
      },
      {
        name: 'Upgrading',
      },
      {
        name: 'PostUpgrade SafetyCheck',
      }
    ];
  }
}
