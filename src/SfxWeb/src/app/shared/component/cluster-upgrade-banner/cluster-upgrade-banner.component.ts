import { Component, Input, HostListener, Injector, OnInit } from '@angular/core';
import { ClusterUpgradeProgress } from 'src/app/Models/DataModels/Cluster';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { RefreshService } from 'src/app/services/refresh.service';

@Component({
  selector: 'app-cluster-upgrade-banner',
  templateUrl: './cluster-upgrade-banner.component.html',
  styleUrls: ['./cluster-upgrade-banner.component.scss']
})
export class ClusterUpgradeBannerComponent implements OnInit {

  displayMiddleText = true;
  displayAllText = true;
  @Input() clusterUpgradeProgress: ClusterUpgradeProgress;

  constructor(private refreshService: RefreshService) {

  }

  ngOnInit() {
    this.refreshService.insertRefreshSubject('upgradeBanner', () => this.refresh());
    this.checkWidth(window.innerWidth);
  }

  public getUpgradeDomainProgress(): string {
    return `(${this.clusterUpgradeProgress.getCompletedUpgradeDomains()} / ${this.clusterUpgradeProgress.upgradeDomains.length} UDs completed)`;
  }


  @HostListener('window:resize', ['$event.target'])
  onResize(event: Window) {
    this.checkWidth(event.innerWidth);
  }

  checkWidth(width: number) {
    this.displayMiddleText = width > 1550;
    this.displayAllText = width > 810;
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    this.checkWidth(window.innerWidth);

    return this.clusterUpgradeProgress.refresh(messageHandler);
  }

}
