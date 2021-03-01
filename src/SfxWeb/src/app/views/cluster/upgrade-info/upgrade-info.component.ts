import { Component, Input, OnInit } from '@angular/core';
import { ClusterUpgradeProgress } from 'src/app/Models/DataModels/Cluster';

@Component({
  selector: 'app-upgrade-info',
  templateUrl: './upgrade-info.component.html',
  styleUrls: ['./upgrade-info.component.scss']
})
export class UpgradeInfoComponent implements OnInit {

  @Input() clusterUpgradeProgress: ClusterUpgradeProgress;

  constructor() { }

  ngOnInit(): void {
  }

}
