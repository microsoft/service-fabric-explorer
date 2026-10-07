import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { ListSettings, ListColumnSettingForLink, ListColumnSetting, ListColumnSettingWithFilter, ListColumnSettingForBadge } from 'src/app/Models/ListSettings';
import { IResponseMessageHandler, ResponseMessageHandlers } from 'src/app/Common/ResponseMessageHandlers';
import { Observable, Subscription } from 'rxjs';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';
import { NodeCollection } from 'src/app/Models/DataModels/collections/NodeCollection';
import { map } from 'rxjs/operators';
import { DashboardViewModel, IDashboardViewModel } from 'src/app/ViewModels/DashboardViewModels';
import { FABRIC_PROCESS_RESOURCE_USAGE_EVENT_KIND, FABRIC_PROCESS_RESOURCE_USAGE_EVENT_LIMIT, FABRIC_PROCESS_RESOURCE_USAGE_LOOKBACK_MS, getLatestFabricProcessResourceUsageByNode, isFabricProcessResourceUsageSampleCurrent } from 'src/app/Models/eventstore/FabricProcessResourceUsage';
import { FabricProcessResourceUsageCapabilityService } from 'src/app/services/fabric-process-resource-usage-capability.service';

@Component({
    selector: 'app-all-nodes',
    templateUrl: './all-nodes.component.html',
    styleUrls: ['./all-nodes.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AllNodesComponent extends BaseControllerDirective {
  private data = inject(DataService);
  private settings = inject(SettingsService);
  private resourceUsageCapability = inject(FabricProcessResourceUsageCapabilityService);


  nodes!: NodeCollection;
  listSettings!: ListSettings;
  tiles: IDashboardViewModel[] = [];
  isAnyNodeThrottling = false;
  resourceUsagePartial = false;

  private nodeThrottlingEvents?: ReturnType<DataService['getNodeThrottlingEventList']>;
  private resourceUsageSubscription?: Subscription;
  private hasRefreshed = false;

  setup() {
    this.hasRefreshed = false;
    this.cancelResourceUsage();
    this.nodes = this.data.nodes;
    this.isAnyNodeThrottling = false;
    this.resourceUsagePartial = false;
    this.listSettings = this.settings.getNewOrExistingListSettings('nodes', ['name'], [
      new ListColumnSettingForLink('name', 'Name', item => item.viewPath),
      new ListColumnSetting('raw.IpAddressOrFQDN', 'Address'),
      new ListColumnSettingWithFilter('raw.Type', 'Node Type'),
      new ListColumnSettingWithFilter('raw.UpgradeDomain', 'Upgrade Domain'),
      new ListColumnSettingWithFilter('raw.FaultDomain', 'Fault Domain'),
      new ListColumnSettingWithFilter('raw.IsSeedNode', 'Is Seed Node'),
      new ListColumnSettingForBadge('healthState', 'Health State'),
      new ListColumnSettingWithFilter('nodeStatus', 'Status'),
      new ListColumnSettingWithFilter('raw.Id.Id', 'Node Id'),
      new ListColumnSettingWithFilter('raw.CodeVersion', 'Code Version'),
    ]);
    this.subscriptions.add(this.data.getClusterManifest().subscribe(manifest => {
      if (manifest.isEventStoreEnabled) {
        this.nodeThrottlingEvents = this.data.getNodeThrottlingEventList(undefined, manifest.eventStoreTimeRange);
        if (this.hasRefreshed) {
          this.refreshNodeThrottlingState();
        }
      } else {
        this.nodeThrottlingEvents = undefined;
        this.isAnyNodeThrottling = false;
      }
    }));
    this.subscriptions.add(this.resourceUsageCapability.ensureSupported().subscribe(isSupported => {
      this.setResourceUsageColumns(isSupported);
      if (isSupported && this.hasRefreshed) {
        this.refreshResourceUsage();
      } else if (!isSupported) {
        this.cancelResourceUsage();
        this.clearResourceUsage();
      }
    }));
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return this.nodes.refresh(messageHandler).pipe(map(() => {
      this.tiles = [];

      this.nodes.getNodeStateCounts(false, false).forEach(type => {
        this.tiles.push(
          DashboardViewModel.fromHealthStateCount(type.nodeType, type.nodeType, false, {
            ErrorCount: type.errorCount,
            WarningCount: type.warningCount,
            OkCount: type.okCount
          })
        );
      });
      this.hasRefreshed = true;
      this.refreshNodeThrottlingState();
      this.refreshResourceUsage();
    }));
  }

  private refreshNodeThrottlingState(): void {
    const refresh = this.nodeThrottlingEvents?.refresh(ResponseMessageHandlers.silentResponseMessageHandler).subscribe(success => {
      this.isAnyNodeThrottling = success && this.nodes.isCurrentlyThrottling(
        this.nodeThrottlingEvents!.collection.map(event => event.raw));
    });
    if (refresh) {
      this.subscriptions.add(refresh);
    }
  }

  private refreshResourceUsage(): void {
    if (!this.resourceUsageCapability.isSupported) {
      this.cancelResourceUsage();
      this.clearResourceUsage();
      return;
    }

    this.cancelResourceUsage();
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - FABRIC_PROCESS_RESOURCE_USAGE_LOOKBACK_MS);
    this.resourceUsageSubscription = this.data.restClient.getNodeEvents(
      startDate,
      endDate,
      undefined,
      [FABRIC_PROCESS_RESOURCE_USAGE_EVENT_KIND],
      ResponseMessageHandlers.silentResponseMessageHandler
    ).subscribe({
      next: events => {
        this.resourceUsagePartial = events.length >= FABRIC_PROCESS_RESOURCE_USAGE_EVENT_LIMIT;
        const nodesByName = new Map(this.nodes.collection.map(node => [node.name, node]));
        const currentInstanceEvents = events.filter(event =>
          nodesByName.get(event.nodeName)?.isEventFromCurrentInstance(event) === true);
        const latestByNode = getLatestFabricProcessResourceUsageByNode(currentInstanceEvents, startDate, endDate);
        this.nodes.collection.forEach(node => {
          const sample = latestByNode.get(node.name);
          node.resourceUsage = sample && isFabricProcessResourceUsageSampleCurrent(sample, endDate) ? sample : undefined;
        });
        this.nodes.collection = [...this.nodes.collection];
      },
      error: () => this.clearResourceUsage()
    });
    this.subscriptions.add(this.resourceUsageSubscription);
  }

  private setResourceUsageColumns(enabled: boolean): void {
    const resourcePaths = new Set(['resourceCpuDisplay', 'resourceMemoryDisplay']);
    const resourceSortPaths = new Set(['resourceCpuPercent', 'resourceMemoryPercent']);
    this.listSettings.columnSettings = this.listSettings.columnSettings.filter(column => !resourcePaths.has(column.propertyPath));

    if (!enabled) {
      if (resourceSortPaths.has(this.listSettings.sortPropertyPaths[0])) {
        this.listSettings.sortPropertyPaths = [...this.listSettings.defaultSortPropertyPaths];
        this.listSettings.sortReverse = false;
      }
      return;
    }

    const nodeIdIndex = this.listSettings.columnSettings.findIndex(column => column.propertyPath === 'raw.Id.Id');
    const insertIndex = nodeIdIndex === -1 ? this.listSettings.columnSettings.length : nodeIdIndex;
    this.listSettings.columnSettings.splice(
      insertIndex,
      0,
      new ListColumnSetting('resourceCpuDisplay', 'Fabric.exe CPU', { sortPropertyPaths: ['resourceCpuPercent'] }),
      new ListColumnSetting('resourceMemoryDisplay', 'Fabric.exe Memory', { sortPropertyPaths: ['resourceMemoryPercent'] })
    );
  }

  private clearResourceUsage(): void {
    this.resourceUsagePartial = false;
    this.nodes.collection.forEach(node => node.resourceUsage = undefined);
    this.nodes.collection = [...this.nodes.collection];
  }

  private cancelResourceUsage(): void {
    this.resourceUsageSubscription?.unsubscribe();
    this.resourceUsageSubscription = undefined;
  }
}
