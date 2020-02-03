import { Component, OnInit, HostListener } from '@angular/core';
import { TreeService } from './services/tree.service';
import { RefreshService } from './services/refresh.service';
import { AdalService } from './services/adal.service';
import { StorageService } from './services/storage.service';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { DataService } from './services/data.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{

  treeWidth: string = "450px";
  rightOffset: string = this.treeWidth;

  hideAzure: boolean = false;
  hideSFXTest: boolean = false;
  hideSFXLogo: boolean = false;
  constructor(public treeService: TreeService,
              private refreshService: RefreshService,
              public adalService: AdalService,
              private storageService: StorageService,
              public breakpointObserver: BreakpointObserver,
              public dataService: DataService) {

  }

  ngOnInit() {

    
    this.treeService.init();
    this.treeService.refresh().subscribe();
    this.refreshService.init();

    this.treeWidth = this.storageService.getValueString("treeWidth", "450px");
    this.rightOffset =  this.treeWidth;

    this.checkWidth(window.innerWidth)
  }
  
  @HostListener('window:resize', ['$event.target'])
  onResize(event: Window) {
    this.checkWidth(event.innerWidth)
  }

  checkWidth(width: number) {
    const widthReduction = this.dataService.clusterUpgradeProgress.isInitialized && this.dataService.clusterUpgradeProgress.isUpgrading ? 300 : 0;
    this.hideAzure = width < (980 + widthReduction);
    this.hideSFXTest = width < (787 + widthReduction);
    this.hideSFXLogo = width < (600 + widthReduction);
  }

  resize($event: number): void {
    //have to subtract the offset
    const offsetWidth = $event + 8;
    this.treeWidth = offsetWidth.toString() + 'px';
    this.rightOffset = this.treeWidth;
    this.storageService.setValue("treeWidth", this.treeWidth);
  }

  attemptForceRefresh() {
    this.refreshService.refreshAll();
  }
}
