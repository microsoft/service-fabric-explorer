import { Component, Injector } from '@angular/core';
import { map, mergeMap } from 'rxjs/operators';
import { Observable, forkJoin, of } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { ListSettings, ListColumnSetting, ListColumnSettingForLink, ListColumnSettingForBadge, ListColumnSettingWithFilter } from 'src/app/Models/ListSettings';
import { SettingsService } from 'src/app/services/settings.service';
import { DeployedApplicationCollection } from 'src/app/Models/DataModels/collections/DeployedApplicationCollection';
import { NodeBaseControllerDirective } from '../NodeBase';
import { IEssentialListItem } from 'src/app/modules/charts/essential-health-tile/essential-health-tile.component';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { NodeStatusConstants } from 'src/app/Common/Constants';

@Component({
  selector: 'app-essentials',
  templateUrl: './essentials.component.html',
  styleUrls: ['./essentials.component.scss']
})
export class EssentialsComponent extends NodeBaseControllerDirective {

  deployedApps: DeployedApplicationCollection;
  listSettings: ListSettings;
  unhealthyEvaluationsListSettings: ListSettings;

  essentialItems: IEssentialListItem[] = [];
  ringInfo: IEssentialListItem[] = [];

  repairJobs = [];
  repairJobSettings: ListSettings;


  constructor(protected data: DataService, injector: Injector, private settings: SettingsService) {
    super(data, injector);
  }

  setup() {
    this.unhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings();
    this.repairJobSettings = this.settings.getNewOrExistingPendingRepairTaskListSettings();

    this.listSettings = this.settings.getNewOrExistingListSettings('apps', ['name'], [
      new ListColumnSettingForLink('name', 'Name', item => item.viewPath),
      new ListColumnSetting('raw.TypeName', 'Application Type'),
      new ListColumnSettingForBadge('health.healthState', 'Health State'),
      new ListColumnSettingWithFilter('raw.Status', 'Status'),
    ]);

    this.essentialItems = [];
    this.ringInfo = [];
    this.repairJobs = [];
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
      })),
      this.data.clusterManifest.ensureInitialized().pipe(mergeMap(() => {
        if (this.data.clusterManifest.isRepairManagerEnabled) {
          return this.data.repairCollection.refresh().pipe(map(() => {
            this.repairJobs = this.data.repairCollection.getRepairJobsForANode(this.node.name);
          }));
        }else {
          return of(null);
        }
      }))

    ]);
  }
}
