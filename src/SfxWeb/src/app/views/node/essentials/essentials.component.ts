import { Component, Injector } from '@angular/core';
import { map } from 'rxjs/operators';
import { Observable, forkJoin, of } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { ListSettings} from 'src/app/Models/ListSettings';
import { SettingsService } from 'src/app/services/settings.service';
import { DeployedApplicationCollection } from 'src/app/Models/DataModels/collections/DeployedApplicationCollection';
import { NodeBaseControllerDirective } from '../NodeBase';
import { IEssentialListItem } from 'src/app/modules/charts/essential-health-tile/essential-health-tile.component';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { DashboardViewModel, IDashboardViewModel } from 'src/app/ViewModels/DashboardViewModels';
import { ITextAndBadge } from 'src/app/Utils/ValueResolver';
import { IRawHealthStateCount } from 'src/app/Models/RawDataTypes';

@Component({
  selector: 'app-essentials',
  templateUrl: './essentials.component.html',
  styleUrls: ['./essentials.component.scss']
})
export class EssentialsComponent extends NodeBaseControllerDirective {

  deployedApps: DeployedApplicationCollection;
  listSettings: ListSettings;

  essentialItems: IEssentialListItem[] = [];
  ringInfo: IEssentialListItem[] = [];

  deployedDashboard: IDashboardViewModel;

  constructor(protected data: DataService, injector: Injector, private settings: SettingsService) {
    super(data, injector);
  }

  setup() {
    this.essentialItems = [];
    this.ringInfo = [];
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{

    let duration = '';
    const up = this.node.raw.NodeDownTimeInSeconds === '0';
    if (up) {
      duration = TimeUtils.getDurationFromSeconds(this.node.raw.NodeUpTimeInSeconds);
    }else{
      duration = TimeUtils.getDurationFromSeconds(this.node.raw.NodeDownTimeInSeconds);
    }

    this.essentialItems = [
      {
        descriptionName: 'IP Address or Domain Name',
        displayText: this.node.raw.IpAddressOrFQDN,
        copyTextValue: this.node.raw.IpAddressOrFQDN,
      },
      {
        descriptionName: up ? 'Up Time' : 'Down Time',
        displayText: duration,
        copyTextValue: duration
      },
      {
        descriptionName: 'Status',
        displayText: this.node.nodeStatus,
        copyTextValue: this.node.nodeStatus,
        selectorName: 'status',
        displaySelector: true
      }
    ];

    this.ringInfo = [
      {
        descriptionName: 'Upgrade Domain',
        displayText: this.node.raw.UpgradeDomain,
        copyTextValue: this.node.raw.UpgradeDomain,
      },
      {
        descriptionName: 'Fault Domain',
        displayText: this.node.raw.FaultDomain,
        copyTextValue: this.node.raw.FaultDomain
      },
      {
        descriptionName: 'Seed Node',
        displayText: this.node.raw.IsSeedNode ? 'Yes' : 'No'
      }
    ];

    return forkJoin([
      this.node.loadInformation.refresh(messageHandler),
      this.node.deployedApps.refresh(messageHandler).pipe(map(() => {
        this.deployedApps = this.node.deployedApps;
        let healthCount:IRawHealthStateCount = {
          ErrorCount: 0,
          WarningCount: 0,
          OkCount: 0
       };
        for(let i in this.deployedApps.data.apps.collection) {
          let healthStatus:ITextAndBadge = this.deployedApps.data.apps.collection[i].data.apps.healthState;
          if(healthStatus.text == 'Error') {
            healthCount["ErrorCount"]++;
          } else if(healthStatus.text == 'Warning') {
            healthCount["WarningCount"]++;
          } else if(healthStatus.text == 'OK') {
            healthCount["OkCount"]++;
          }
        }
        this.deployedDashboard = DashboardViewModel.fromHealthStateCount("Deployed", "Deployed", false, healthCount);
      }))

    ]);
  }
}
