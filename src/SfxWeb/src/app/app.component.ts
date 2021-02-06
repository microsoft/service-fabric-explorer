import { Component, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { TreeService } from './services/tree.service';
import { RefreshService } from './services/refresh.service';
import { AdalService } from './services/adal.service';
import { StorageService } from './services/storage.service';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { DataService } from './services/data.service';
import { environment } from 'src/environments/environment';
import { LiveAnnouncer } from '@angular/cdk/a11y';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{

  @ViewChild('main') main: ElementRef;

  smallScreenSize = false;
  smallScreenLeftPanelWidth = '0px';

  public assetBase = environment.assetBase;
  treeWidth = '450px';
  rightOffset: string = this.treeWidth;
  tabIndex = -1;
  hideAzure = false;
  hideSFXTest = false;
  hideSFXLogo = false;
  constructor(public treeService: TreeService,
              public refreshService: RefreshService,
              public adalService: AdalService,
              private storageService: StorageService,
              public breakpointObserver: BreakpointObserver,
              public dataService: DataService,
              public liveAnnouncer: LiveAnnouncer) {

  }

  ngOnInit() {
    this.treeService.init();
    this.treeService.refresh().subscribe();
    this.refreshService.init();

    this.treeWidth = this.storageService.getValueString('treeWidth', '450px');
    this.rightOffset =  this.treeWidth;

    this.checkWidth(window.innerWidth);
  }

  @HostListener('window:resize', ['$event.target'])
  onResize(event: Window) {
    this.checkWidth(event.innerWidth);
  }

  checkWidth(width: number) {
    const widthReduction = this.dataService.clusterUpgradeProgress.isInitialized && this.dataService.clusterUpgradeProgress.isUpgrading ? 300 : 0;
    this.smallScreenSize = width < 720;

    this.hideAzure = width < (980 + widthReduction);
    this.hideSFXTest = width < (787 + widthReduction);
    this.hideSFXLogo = width < (600 + widthReduction);
  }

  resize($event: number): void {
    if (this.smallScreenSize) {
      this.smallScreenLeftPanelWidth = `${$event}px`;
      return;
    }
    // have to subtract the offset
    const offsetWidth = $event + 8;
    this.treeWidth = offsetWidth.toString() + 'px';
    this.rightOffset = this.treeWidth;
    this.storageService.setValue('treeWidth', this.treeWidth);
  }

  changeSmallScreenSizePanelState() {
    this.smallScreenLeftPanelWidth = this.smallScreenLeftPanelWidth === '0px' ? '60%' : '0px';
  }

  attemptForceRefresh() {
    this.refreshService.refreshAll();
    this.liveAnnouncer.announce('Started refreshing data');
    setTimeout( () => {
      this.liveAnnouncer.announce('Data has been refreshed.');
    }, 2000);
  }

  setMainFocus() {
    this.tabIndex = -1;
    setTimeout(() => {this.main.nativeElement.focus(); this.tabIndex = null; }, 0);
  }
}
