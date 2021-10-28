import { Component, OnInit, HostListener, ViewChild, ElementRef, Inject } from '@angular/core';
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
import { RestClientService } from './services/rest-client.service';
import { MsalService, MsalBroadcastService, MSAL_GUARD_CONFIG, MsalGuardConfiguration } from '@azure/msal-angular';
import { AuthenticationResult, InteractionStatus, InteractionType, PopupRequest, RedirectRequest } from '@azure/msal-browser';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  loginDisplay = false;

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
  showTree = false;
  constructor(public treeService: TreeService,
              public refreshService: RefreshService,
              public adalService: AdalService,
              private storageService: StorageService,
              public breakpointObserver: BreakpointObserver,
              public dataService: DataService,
              public liveAnnouncer: LiveAnnouncer,
              private snackBar: MatSnackBar,
              private restClient: RestClientService,
              private msalService: MsalService,
              private msalBroadcastService: MsalBroadcastService,
              @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
              ) {

  }

  async ngOnInit() {
    console.log(`SFX VERSION : ${environment.version}`);

    const aadMetaData = await this.restClient.getAADmetadata().toPromise();

    console.log(this.msalService.instance.getAllAccounts())

    if(aadMetaData.isAadAuthType) {
      this.login()
      // this.msalService.instance = new PublicClientApplication({
      //   auth: {
      //     clientId: aadMetaData.raw.metadata.cluster,
      //     authority:  aadMetaData.raw.metadata.authority,
      //     redirectUri: aadMetaData.raw.metadata.redirect,
      //     // redirectUri: 'http://localhost:4200',
      //     // postLogoutRedirectUri: 'http://localhost:4200'
      //   },
      //   cache: {
      //     cacheLocation: BrowserCacheLocation.LocalStorage,
      //     // storeAuthStateInCookie: isIE, // set to true for IE 11
      //   },
      //   system: {
      //     loggerOptions: {
      //       loggerCallback,
      //       logLevel: LogLevel.Info,
      //       piiLoggingEnabled: false
      //     }
      //   }
      // });
      // console.log(this.msalService)
      // this.msalBroadcastService.inProgress$
      //   .pipe(
      //     filter((status: InteractionStatus) => status === InteractionStatus.None),
      //   ).subscribe(async(data) => {
      //     console.log(data)
      //     // await this.msalService.loginRedirect();

      //   })


      //   if (this.msalGuardConfig.authRequest){
      //     this.msalService.loginRedirect({...this.msalGuardConfig.authRequest} as RedirectRequest);
      //   } else {
      //     this.msalService.loginRedirect();
      //   }
    }else{
      this.treeService.init();
      this.treeService.refresh().subscribe();
      this.refreshService.init();
      this.showTree = true;
    }

    this.treeWidth = this.storageService.getValueString('treeWidth', '450px');
    this.rightOffset =  this.treeWidth;

    this.checkWidth(window.innerWidth);

    if (!this.storageService.getValueBoolean(TelemetryService.localStoragePromptedTelemetryKey, false) && environment.telemetryKey.length > 0) {
      const config = new MatSnackBarConfig();
      config.duration = 30000;
      this.snackBar.openFromComponent(TelemetrySnackBarComponent, config);
      this.storageService.setValue(TelemetryService.localStoragePromptedTelemetryKey, true);
    }
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



  setLoginDisplay() {
    this.loginDisplay = this.msalService.instance.getAllAccounts().length > 0;
  }

  checkAndSetActiveAccount(){
    /**
     * If no active account set but there are accounts signed in, sets first account to active account
     * To use active account set here, subscribe to inProgress$ first in your component
     * Note: Basic usage demonstrated. Your app may require more complicated account selection logic
     */
    let activeAccount = this.msalService.instance.getActiveAccount();

    if (!activeAccount && this.msalService.instance.getAllAccounts().length > 0) {
      let accounts = this.msalService.instance.getAllAccounts();
      this.msalService.instance.setActiveAccount(accounts[0]);
    }
  }

  login() {
    if (this.msalGuardConfig.interactionType === InteractionType.Popup) {
      if (this.msalGuardConfig.authRequest){
        this.msalService.loginPopup({...this.msalGuardConfig.authRequest} as PopupRequest)
          .subscribe((response: AuthenticationResult) => {
            this.msalService.instance.setActiveAccount(response.account);
          });
        } else {
          this.msalService.loginPopup()
            .subscribe((response: AuthenticationResult) => {
              this.msalService.instance.setActiveAccount(response.account);
            });
      }
    } else {
      if (this.msalGuardConfig.authRequest){
        this.msalService.loginRedirect({...this.msalGuardConfig.authRequest} as RedirectRequest);
      } else {
        this.msalService.loginRedirect();
      }
    }
  }
}
