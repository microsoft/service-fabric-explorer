import { Component, OnInit, Input } from '@angular/core';
import { IRawNodeUpgradeProgress } from 'src/app/Models/RawDataTypes';

@Component({
  selector: 'app-node-upgrade-progress',
  templateUrl: './node-upgrade-progress.component.html',
  styleUrls: ['./node-upgrade-progress.component.scss']
})
export class NodeUpgradeProgressComponent implements OnInit {

  @Input() nodeProgress: IRawNodeUpgradeProgress;
  
  constructor() { }

  ngOnInit(): void {
  }

}
