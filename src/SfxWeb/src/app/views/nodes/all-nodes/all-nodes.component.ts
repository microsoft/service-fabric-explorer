import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { ListSettings, ListColumnSettingForLink, ListColumnSetting, ListColumnSettingWithFilter, ListColumnSettingForBadge } from 'src/app/Models/ListSettings';
import { IResponseMessageHandler, ResponseMessageHandlers } from 'src/app/Common/ResponseMessageHandlers';
import { Observable, forkJoin } from 'rxjs';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';
import { NodeCollection } from 'src/app/Models/DataModels/collections/NodeCollection';
import { map } from 'rxjs/operators';
import { DashboardViewModel, IDashboardViewModel } from 'src/app/ViewModels/DashboardViewModels';
import { NodeThrottlingTimelineGenerator } from 'src/app/Models/eventstore/timelineGenerators';

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


  nodes!: NodeCollection;
  listSettings!: ListSettings;
  tiles: IDashboardViewModel[] = [];
  isAnyNodeThrottling = false;

  private nodeThrottlingEventData!: ReturnType<DataService['getNodeThrottlingEventData']>;

  setup() {
    this.nodes = this.data.nodes;
    this.isAnyNodeThrottling = false;
    this.nodeThrottlingEventData = this.data.getNodeThrottlingEventData();
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
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return forkJoin([
      this.nodes.refresh(messageHandler).pipe(map(() => {
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
      })),
      this.nodeThrottlingEventData.eventsList.refresh(ResponseMessageHandlers.silentResponseMessageHandler)
    ]).pipe(map(([, eventsLoaded]) => {
      const currentNodeIdentities = new Map(this.nodes.collection.map(node => [
        node.name,
        {
          nodeId: node.raw.Id.Id,
          instanceId: node.raw.InstanceId,
          nodeUpAt: node.raw.NodeUpAt
        }
      ]));
      this.isAnyNodeThrottling = eventsLoaded &&
        NodeThrottlingTimelineGenerator.isCurrentlyThrottling(
          this.nodeThrottlingEventData.getEvents!(),
          currentNodeIdentities);
    }));
  }
}
