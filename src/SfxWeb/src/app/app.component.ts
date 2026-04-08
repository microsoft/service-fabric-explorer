import { Component, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { TreeService } from './services/tree.service';
import { RefreshService } from './services/refresh.service';
import { AdalService } from './services/adal.service';
import { StorageService } from './services/storage.service';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { DataService } from './services/data.service';
import { environment } from 'src/environments/environment';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TelemetryService } from './services/telemetry.service';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { TelemetrySnackBarComponent } from './telemetry-snack-bar/telemetry-snack-bar.component';
import { SettingsService } from './services/settings.service';
import { FocusService } from './services/focus.service';
import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{

  @ViewChild('main') main: ElementRef;

  smallScreenSize = false;
  smallScreenLeftPanelWidth = '0%';

  treeDisplay = 'inherit';
  smallScreenTreeDisplay = 'none';

  public assetBase = environment.assetBase;
  treeWidth = '450px';
  // preserve the existing size for using
  previousTreeWidth = this.treeWidth;

  rightOffset: string = this.treeWidth;
  shortenAzure = false;
  hideSFXText = false;
  shrinkAllHeaderItem = false;
  constructor(public treeService: TreeService,
              public refreshService: RefreshService,
              public adalService: AdalService,
              private storageService: StorageService,
              public breakpointObserver: BreakpointObserver,
              public dataService: DataService,
              public liveAnnouncer: LiveAnnouncer,
              private snackBar: MatSnackBar,
              private settingsService: SettingsService,
              private focusService: FocusService,
              private titleService: Title,
              private router: Router) {

  }

  ngOnInit() {
    console.log(`SFX VERSION : ${environment.version}`);

    this.treeService.init();
    this.treeService.refresh().subscribe();
    this.refreshService.init();

    this.treeWidth = this.storageService.getValueString('treeWidth', '450px');
    this.settingsService.treeWidth.next(this.treeWidth);
    this.rightOffset =  this.treeWidth;

    this.checkWidth(window.innerWidth);

    if (!this.storageService.getValueBoolean(TelemetryService.localStoragePromptedTelemetryKey, false) && environment.telemetryKey.length > 0) {
      const config = new MatSnackBarConfig();
      config.duration = 30000;
      this.snackBar.openFromComponent(TelemetrySnackBarComponent, config);
      this.storageService.setValue(TelemetryService.localStoragePromptedTelemetryKey, true);
    }

    // Set up page title updates based on route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updatePageTitle();
    });
    
    // Set initial title
    this.updatePageTitle();
  }

  @HostListener('window:resize', ['$event.target'])
  onResize(event: Window) {
    this.checkWidth(event.innerWidth);
  }

  checkWidth(width: number) {
    const widthReduction = this.dataService.clusterUpgradeProgress.isInitialized && this.dataService.clusterUpgradeProgress.isUpgrading ? 300 : 0;
    this.smallScreenSize = width < 720;

    this.shortenAzure = width < (980 + widthReduction);
    this.hideSFXText = width < (787 + widthReduction);
    this.shrinkAllHeaderItem = width < (600 + widthReduction);
  }

  resize($event: number): void {
    if (this.smallScreenSize) {
      if ($event == 0) {
        this.smallScreenTreeDisplay = 'none';
      }
      else {
        this.smallScreenTreeDisplay = 'inherit';
      }
      this.smallScreenLeftPanelWidth = `${$event}%`;
      return;
    }

    if ($event == 0) {
      this.treeDisplay = 'none';
    }
    else {
      this.treeDisplay = 'inherit';
    }
    this.previousTreeWidth = this.treeWidth;
    // have to subtract the offset
    const offsetWidth = $event + 8;
    this.treeWidth = offsetWidth.toString() + 'px';
    this.rightOffset = this.treeWidth;
    this.storageService.setValue('treeWidth', this.treeWidth);
    this.settingsService.treeWidth.next(this.treeWidth);
  }

  collapseSide()  {
    if (this.treeWidth === '8px') {
      this.resize(+this.previousTreeWidth.split('px')[0]);
    }else{
      this.resize(0);
    }
  }

  attemptForceRefresh() {
    this.refreshService.refreshAll();
    this.liveAnnouncer.announce('Started refreshing data');
    setTimeout( () => {
      this.liveAnnouncer.announce('Data has been refreshed.');
    }, 2000);
  }

  setMainFocus() {
    this.focusService.focus()
  }

  private updatePageTitle(): void {
    const baseTitle = 'Service Fabric Explorer';
    const url = this.router.url;
    
    // Remove the hash prefix if present
    const path = url.startsWith('#') ? url.substring(1) : url;
    
    // Parse the path to determine the page title
    let pageTitle = '';
    
    if (path === '/' || path === '') {
      pageTitle = 'Cluster';
    } else if (path.startsWith('/apps')) {
      pageTitle = 'Applications';
    } else if (path.startsWith('/apptype/')) {
      const parts = path.split('/');
      if (parts.length >= 3) {
        const appTypeName = decodeURIComponent(parts[2]);
        if (parts.length >= 5 && parts[3] === 'app') {
          const appId = decodeURIComponent(parts[4]);
          if (parts.length >= 7 && parts[5] === 'service') {
            const serviceId = decodeURIComponent(parts[6]);
            if (parts.length >= 9 && parts[7] === 'partition') {
              const partitionId = decodeURIComponent(parts[8]);
              if (parts.length >= 11 && parts[9] === 'replica') {
                pageTitle = `Replica ${parts[10]}`;
              } else {
                pageTitle = `Partition ${partitionId}`;
              }
            } else {
              pageTitle = `Service ${serviceId}`;
            }
          } else {
            pageTitle = `Application ${appId}`;
          }
        } else {
          pageTitle = `Application Type ${appTypeName}`;
        }
      }
    } else if (path.startsWith('/app')) {
      pageTitle = 'Application';
    } else if (path.startsWith('/nodes')) {
      pageTitle = 'Nodes';
    } else if (path.startsWith('/node/')) {
      const parts = path.split('/');
      if (parts.length >= 3) {
        const nodeName = decodeURIComponent(parts[2]);
        if (parts.length >= 5 && parts[3] === 'deployedapp') {
          const appId = decodeURIComponent(parts[4]);
          if (parts.length >= 7 && parts[5] === 'deployedservice') {
            const serviceId = decodeURIComponent(parts[6]);
            if (parts.indexOf('replica') >= 0) {
              pageTitle = `Deployed Replica on ${nodeName}`;
            } else if (parts.indexOf('codepackage') >= 0) {
              pageTitle = `Code Package on ${nodeName}`;
            } else {
              pageTitle = `Deployed Service on ${nodeName}`;
            }
          } else {
            pageTitle = `Deployed App on ${nodeName}`;
          }
        } else {
          pageTitle = `Node ${nodeName}`;
        }
      }
    } else if (path.startsWith('/system/apps')) {
      pageTitle = 'System Applications';
    } else if (path.startsWith('/cluster-insights')) {
      pageTitle = 'Cluster Insights';
    } else if (path.startsWith('/networking')) {
      pageTitle = 'Networking';
    } else {
      // Default to a generic title based on the first path segment
      const firstSegment = path.split('/')[1];
      if (firstSegment) {
        pageTitle = firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1);
      }
    }
    
    // Set the title
    if (pageTitle) {
      this.titleService.setTitle(`${pageTitle} - ${baseTitle}`);
    } else {
      this.titleService.setTitle(baseTitle);
    }
  }
}
