import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { Observable, forkJoin, of, Subscription } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
import { IResponseMessageHandler, ResponseMessageHandlers } from 'src/app/Common/ResponseMessageHandlers';
import { ListSettings, ListColumnSetting, ListColumnSettingForLink, ListColumnSettingForBadge, ListColumnSettingWithFilter } from 'src/app/Models/ListSettings';
import { SettingsService } from 'src/app/services/settings.service';
import { DeployedApplicationCollection } from 'src/app/Models/DataModels/collections/DeployedApplicationCollection';
import { NodeBaseControllerDirective } from '../NodeBase';
import { IEssentialListItem } from 'src/app/modules/charts/essential-health-tile/essential-health-tile.component';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { INodeTypeInfo } from 'src/app/Models/DataModels/Cluster';
import { RepairTask } from 'src/app/Models/DataModels/repairTask';
import { FABRIC_PROCESS_RESOURCE_USAGE_EVENT_KIND, FABRIC_PROCESS_RESOURCE_USAGE_LOOKBACK_MS, formatFabricProcessResourceBytes, IFabricProcessResourceUsageSample, isFabricProcessResourceUsageSampleCurrent, parseFabricProcessResourceUsageEvent } from 'src/app/Models/eventstore/FabricProcessResourceUsage';
import { FabricProcessResourceUsageCapabilityService } from 'src/app/services/fabric-process-resource-usage-capability.service';

interface IResourceUsage {
  cpuPercent: number;
  cpuDisplay: string;
  memoryPercent: number;
  memoryDisplay: string;
  sampledAt: string;
  timestamp: Date;
}

@Component({
    selector: 'app-essentials',
    templateUrl: './essentials.component.html',
    styleUrls: ['./essentials.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class EssentialsComponent extends NodeBaseControllerDirective {
  private static readonly resourceUsageRefreshIntervalMs = 5 * 60 * 1000;

  protected data: DataService = inject(DataService);
  private settings = inject(SettingsService);
  private resourceUsageCapability = inject(FabricProcessResourceUsageCapabilityService);


  deployedApps!: DeployedApplicationCollection;
  listSettings!: ListSettings;

  essentialItems: IEssentialListItem[] = [];
  ringInfo: IEssentialListItem[] = [];
  resourceUsage?: IResourceUsage;

  repairJobs: RepairTask[] = [];
  repairJobSettings!: ListSettings;

  placementProperties!: INodeTypeInfo;
  isNodeThrottling = false;

  private nodeThrottlingEvents?: ReturnType<DataService['getNodeThrottlingEventList']>;
  private resourceUsageSubscription?: Subscription;
  private resourceUsageRequestedAt?: number;
  private hasRefreshed = false;

  setup() {
    this.hasRefreshed = false;
    this.cancelResourceUsage();
    this.resourceUsageRequestedAt = undefined;
    this.repairJobSettings = this.settings.getNewOrExistingPendingRepairTaskListSettings();

    this.listSettings = this.settings.getNewOrExistingListSettings('apps', ['name'], [
      new ListColumnSettingForLink('name', 'Name', item => item.viewPath),
      new ListColumnSetting('raw.TypeName', 'Application Type'),
      new ListColumnSettingForBadge('health.healthState', 'Health State'),
      new ListColumnSettingWithFilter('raw.Status', 'Status'),
    ]);

    this.essentialItems = [];
    this.ringInfo = [];
    this.resourceUsage = undefined;
    this.repairJobs = [];
    this.isNodeThrottling = false;
    this.subscriptions.add(this.data.getClusterManifest().subscribe(manifest => {
      if (manifest.isEventStoreEnabled) {
        this.nodeThrottlingEvents = this.data.getNodeThrottlingEventList(this.nodeName, manifest.eventStoreTimeRange);
        if (this.hasRefreshed) {
          this.refreshNodeThrottlingState();
        }
      } else {
        this.nodeThrottlingEvents = undefined;
        this.isNodeThrottling = false;
      }
    }));
    this.subscriptions.add(this.resourceUsageCapability.ensureSupported().subscribe(isSupported => {
      if (isSupported && this.hasRefreshed) {
        this.refreshResourceUsage();
      } else if (!isSupported) {
        this.cancelResourceUsage();
        this.resourceUsageRequestedAt = undefined;
        this.resourceUsage = undefined;
      }
    }));
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    this.hasRefreshed = true;
    this.refreshNodeThrottlingState();
    this.refreshResourceUsage();

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
      },
      {
        descriptionName: "Node Type",
        displayText: this.node.raw.Type,
        copyTextValue: this.node.raw.Type
      }
    ];

    return forkJoin([
      this.node.loadInformation.refresh(messageHandler),
      this.node.deployedApps.refresh(messageHandler).pipe(map(() => {
        this.deployedApps = this.node.deployedApps;
      })),
      this.data.clusterManifest.ensureInitialized().pipe(mergeMap(() => {
        this.placementProperties = this.data.clusterManifest.getNodeProperties(this.node.raw.Type)!;
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

  private refreshNodeThrottlingState(): void {
    const refresh = this.nodeThrottlingEvents?.refresh(ResponseMessageHandlers.silentResponseMessageHandler).subscribe(success => {
      this.isNodeThrottling = success && this.data.nodes.isCurrentlyThrottling(
        this.nodeThrottlingEvents!.collection.map(event => event.raw),
        this.nodeName);
    });
    if (refresh) {
      this.subscriptions.add(refresh);
    }
  }

  private refreshResourceUsage(): void {
    if (!this.resourceUsageCapability.isSupported) {
      this.cancelResourceUsage();
      this.resourceUsageRequestedAt = undefined;
      this.resourceUsage = undefined;
      return;
    }

    const now = Date.now();
    if ((this.resourceUsageSubscription && !this.resourceUsageSubscription.closed)
      || (this.resourceUsageRequestedAt !== undefined
        && now - this.resourceUsageRequestedAt < EssentialsComponent.resourceUsageRefreshIntervalMs)) {
      return;
    }

    this.resourceUsageRequestedAt = now;
    this.resourceUsageSubscription = this.loadResourceUsage().subscribe();
    this.subscriptions.add(this.resourceUsageSubscription);
  }

  private loadResourceUsage(): Observable<any> {
    const requestedNodeName = this.nodeName;
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - FABRIC_PROCESS_RESOURCE_USAGE_LOOKBACK_MS);

    return this.data.restClient.getNodeEvents(
      startTime,
      endTime,
      requestedNodeName,
      [FABRIC_PROCESS_RESOURCE_USAGE_EVENT_KIND],
      ResponseMessageHandlers.silentResponseMessageHandler
    ).pipe(
      map(events => {
        if (this.nodeName !== requestedNodeName) {
          return;
        }

        const latestSample = events
          .filter(event => this.node.isEventFromCurrentInstance(event))
          .map(event => parseFabricProcessResourceUsageEvent(event, requestedNodeName))
          .filter((sample): sample is IFabricProcessResourceUsageSample => sample !== undefined
            && isFabricProcessResourceUsageSampleCurrent(sample, endTime))
          .sort((left, right) => right.timestamp.getTime() - left.timestamp.getTime())[0];

        if (!latestSample) {
          this.resourceUsage = undefined;
          return;
        }

        this.resourceUsage = {
          cpuPercent: latestSample.cpuPercent,
          cpuDisplay: `${latestSample.cpuPercent.toFixed(2)}%`,
          memoryPercent: latestSample.memoryPercent,
          memoryDisplay: `${formatFabricProcessResourceBytes(latestSample.memoryRssBytes)} (${latestSample.memoryPercent.toFixed(1)}%)`,
          sampledAt: this.formatTimestamp(latestSample.timestamp),
          timestamp: latestSample.timestamp
        };
      }),
      catchError(() => {
        if (this.nodeName === requestedNodeName) {
          this.resourceUsage = undefined;
        }
        return of(null);
      })
    );
  }

  private cancelResourceUsage(): void {
    this.resourceUsageSubscription?.unsubscribe();
    this.resourceUsageSubscription = undefined;
  }

  private formatTimestamp(timestamp: Date): string {
    return timestamp.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC');
  }
}
