import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { IRawNodeUpgradeProgress } from 'src/app/Models/RawDataTypes';


// PreUpgradeSafetyCheck - The upgrade has not started yet due to pending safety checks. The value is 1
// Upgrading - The upgrade is in progress. The value is 2
// PostUpgradeSafetyCheck - The upgrade has completed and post upgrade safety checks are being performed. The value is 3

@Component({
  selector: 'app-node-progress',
  templateUrl: './node-progress.component.html',
  styleUrls: ['./node-progress.component.scss']
})
export class NodeProgressComponent implements OnChanges {

  @Input()node: IRawNodeUpgradeProgress;

  public progress: IProgressStatus[] = [];

  // The following maps use
  // -1 - done
  // 0 - inprogress
  // 1 - not started
  public iconMap = {
    '-1': 'mif-checkmark',
    0: 'mif-spinner4 rotate',
  };

  public cssClass = {
    '-1': 'done',
    0: 'in-progress',
    1: 'pending'
  };

  constructor() { }

  ngOnChanges(): void {
    const phaseMap = {
      PreUpgradeSafetyCheck: 1,
      Upgrading: 2,
      PostUpgradeSafetyCheck: 3
    };

    const index = phaseMap[this.node.UpgradePhase];

    this.progress = [
      {
        name: 'PreUpgrade SafetyCheck',
        state: this.getPhaseReference(index, 1)
      },
      {
        name: 'Upgrading',
        state: this.getPhaseReference(index, 2)
      },
      {
        name: 'PostUpgrade SafetyCheck',
        state: this.getPhaseReference(index, 3)
      }
    ];
  }

  getPhaseReference(index: number, currentPhase: number) {
    const diff = currentPhase - index;
    if (diff >= 1) {
      return 1;
    }else if (diff <= -1) {
      return -1;
    }else{
      return 0;
    }
  }

}

interface IProgressStatus {
  name: string;
  state: number;
}
