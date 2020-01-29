import { Component, OnInit, Input, HostListener } from '@angular/core';
import { ClusterUpgradeProgress } from 'src/app/Models/DataModels/Cluster';

@Component({
  selector: 'app-cluster-upgrade-banner',
  templateUrl: './cluster-upgrade-banner.component.html',
  styleUrls: ['./cluster-upgrade-banner.component.scss']
})
export class ClusterUpgradeBannerComponent implements OnInit {

  displayMiddleText: boolean = true;
  displayAllText: boolean = true;
  @Input() clusterUpgradeProgress: ClusterUpgradeProgress;

  constructor() { }

  ngOnInit() {
    this.checkWidth(window.innerWidth); //TODO make sure window is there?
  }

  public getUpgradeDomainProgress(): string {
    return `(${this.clusterUpgradeProgress.getCompletedUpgradeDomains()} / ${this.clusterUpgradeProgress.upgradeDomains.length} UDs completed)`;
  }


  @HostListener('window:resize', ['$event.target'])
  onResize(event: Window) {
    this.checkWidth(event.innerWidth)
  }

  checkWidth(width: number) {
    this.displayMiddleText = width > 1550;
    this.displayAllText = width > 810;
  }

}
