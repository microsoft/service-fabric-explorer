import { Component, Input, OnInit } from '@angular/core';
import { IRawNodeUpgradeProgress } from 'src/app/Models/RawDataTypes';

@Component({
  selector: 'app-node-progress',
  templateUrl: './node-progress.component.html',
  styleUrls: ['./node-progress.component.scss']
})
export class NodeProgressComponent implements OnInit {

  @Input()node: IRawNodeUpgradeProgress;

  constructor() { }

  ngOnInit(): void {
  }

}

// PreUpgradeSafetyCheck - The upgrade has not started yet due to pending safety checks. The value is 1
// Upgrading - The upgrade is in progress. The value is 2
// PostUpgradeSafetyCheck - The upgrade has completed and post upgrade safety checks are being performed. The value is 3