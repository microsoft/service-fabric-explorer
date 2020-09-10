import { Component, OnInit, Input, HostListener, Injector } from '@angular/core';
import { ClusterUpgradeProgress } from 'src/app/Models/DataModels/Cluster';
import { BaseController } from 'src/app/ViewModels/BaseController';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-cluster-upgrade-banner',
  templateUrl: './cluster-upgrade-banner.component.html',
  styleUrls: ['./cluster-upgrade-banner.component.scss']
})
export class ClusterUpgradeBannerComponent extends BaseController {

  displayMiddleText = true;
  displayAllText = true;
  @Input() clusterUpgradeProgress: ClusterUpgradeProgress;

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
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
    return this.clusterUpgradeProgress.refresh(messageHandler);
  }

}
