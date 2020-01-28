import { Component, OnInit, Input } from '@angular/core';
import { ClusterUpgradeProgress } from 'src/app/Models/DataModels/Cluster';

@Component({
  selector: 'app-cluster-upgrade-banner',
  templateUrl: './cluster-upgrade-banner.component.html',
  styleUrls: ['./cluster-upgrade-banner.component.scss']
})
export class ClusterUpgradeBannerComponent implements OnInit {

  @Input() clusterUpgradeProgress: ClusterUpgradeProgress;

  constructor() { }

  ngOnInit() {
  }

  public getUpgradeDomainProgress(): string {
    return `(${this.clusterUpgradeProgress.getCompletedUpgradeDomains()} / ${this.clusterUpgradeProgress.upgradeDomains.length} UDs completed)`;
}


}
