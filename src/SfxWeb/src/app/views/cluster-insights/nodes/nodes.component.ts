import { Component, Injector } from '@angular/core';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { RestClientService } from 'src/app/services/rest-client.service';
import { DataService } from 'src/app/services/data.service';
import { IRawNode, IRawNodeStatusCount } from 'src/app/Models/RawDataTypes';
import { Node } from 'src/app/Models/DataModels/Node';
import { ListSettings, ListColumnSetting, ListColumnSettingWithFilter, ListColumnSettingForBadge } from 'src/app/Models/ListSettings';
import { NodeStatusConstants, ReplicaRoles, BadgeConstants } from 'src/app/Common/Constants';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';
import { ListColumnSettingWithExpandableLink } from '../expandable-link/expandable-link.component';
import { ListColumnSettingForExpandedDetails } from '../expanded-details/expanded-details.component';
import { IDashboardViewModel, DashboardViewModel } from 'src/app/ViewModels/DashboardViewModels';
import { IEssentialListItem } from 'src/app/modules/charts/essential-health-tile/essential-health-tile.component';

interface NodeDisplay {
  name: string;
  raw: IRawNode;
  nodeStatusBadge: { text: string; badgeClass: string };
  nodeStatus: string;
  isClickable: boolean;
  isSecondRowCollapsed: boolean;
  expandedDetails?: Record<string, string>;
  icon?: { src: string; alt: string; title: string };
  color: string;
  detailsLoaded?: boolean;
}

@Component({
  selector: 'app-nodes',
  templateUrl: './nodes.component.html',
  styleUrls: ['./nodes.component.scss']
})
export class NodesComponent extends BaseControllerDirective {
  nodes: NodeDisplay[] = [];
  seedNodes: NodeDisplay[] = [];
  nonSeedNodes: NodeDisplay[] = [];
  listSettings!: ListSettings;
  faultDomainCount = 0;
  upgradeDomainCount = 0;
  uniqueCodeVersions: string[] = [];
  tiles: IDashboardViewModel[] = [];
  essentialItems: IEssentialListItem[] = [];
  isLoading = true;

  override fixedRefreshIntervalMs = 65000; // 65 seconds

  constructor(private restClient: RestClientService, private dataService: DataService, injector: Injector) {
    super(injector);
  }

  setup(): void {
    this.setupListSettings();
  }

  refresh(): Observable<any> {
    this.isLoading = true;
    return this.dataService.getNodes(true).pipe(
      map(nodeCollection => {
        const nodes = nodeCollection.collection;

        this.nodes = nodes.map(node => this.buildNodeDisplay(node));

        this.seedNodes = this.nodes.filter(node => node.raw.IsSeedNode);
        this.nonSeedNodes = this.nodes.filter(node => !node.raw.IsSeedNode);

        this.faultDomainCount = nodeCollection.faultDomains.length;
        this.upgradeDomainCount = nodeCollection.upgradeDomains.length;
        this.uniqueCodeVersions = [...new Set(nodes.map(node => node.raw.CodeVersion))];

        this.updateItemInEssentials();
        this.updateTiles();
        this.isLoading = false;
      }),
      catchError(() => {
        this.isLoading = false;
        return of(null);
      })
    );
  }

  private buildNodeDisplay(node: Node): NodeDisplay {
    const nodeStatus = node.raw.NodeStatus || NodeStatusConstants.Unknown;
    const nodeStatusBadge = this.getNodeStatusBadge(nodeStatus);

    return {
      name: node.name,
      raw: node.raw,
      nodeStatus,
      nodeStatusBadge,
      isClickable: true,
      isSecondRowCollapsed: true,
      color: `var(--${nodeStatusBadge.badgeClass})`,
      icon: node.raw.IsSeedNode ? { src: 'assets/seed.svg', alt: 'Seed Node', title: 'Seed Node' } : undefined,
      detailsLoaded: false
    };
  }

  private setupListSettings(): void {
    const clickHandler = this.handleNodeClick.bind(this);

    const columnSettings = [
      new ListColumnSettingWithExpandableLink('name', 'Name', clickHandler),
      new ListColumnSetting('raw.IpAddressOrFQDN', 'Address'),
      new ListColumnSettingWithFilter('raw.Type', 'Node Type'),
      new ListColumnSettingWithFilter('raw.UpgradeDomain', 'Upgrade Domain'),
      new ListColumnSettingWithFilter('raw.FaultDomain', 'Fault Domain'),
      new ListColumnSettingWithFilter('raw.IsSeedNode', 'Is Seed Node'),
      new ListColumnSettingForBadge('nodeStatusBadge', 'Status'),
      new ListColumnSettingWithFilter('raw.Id.Id', 'Node Id'),
      new ListColumnSettingWithFilter('raw.CodeVersion', 'Code Version')
    ];

    const secondRowColumnSettings = [
      new ListColumnSettingForExpandedDetails('Deployed Replicas', { colspan: -1 })
    ];

    this.listSettings = new ListSettings(
      15,
      null,
      'nodes',
      columnSettings,
      secondRowColumnSettings,
      true,
      (item) => item.isClickable,
      true,  // searchable
      false  // showRowExpander
    );
  }

  private getNodeStatusBadge(nodeStatus: string): { text: string; badgeClass: string } {
    switch (nodeStatus) {
      case NodeStatusConstants.Up:
        return { text: nodeStatus, badgeClass: BadgeConstants.BadgeOK };
      case NodeStatusConstants.Down:
        return { text: nodeStatus, badgeClass: BadgeConstants.BadgeError };
      case NodeStatusConstants.Disabling:
      case NodeStatusConstants.Disabled:
        return { text: nodeStatus, badgeClass: BadgeConstants.BadgeWarning };
      default:
        return { text: nodeStatus, badgeClass: BadgeConstants.BadgeUnknown };
    }
  }

  private updateTiles(): void {
    const nodeStatusCount: IRawNodeStatusCount = {
      UpCount: this.nodes.filter(node => node.nodeStatus === NodeStatusConstants.Up).length,
      DisabledCount: this.nodes.filter(node => node.nodeStatus === NodeStatusConstants.Disabled || node.nodeStatus === NodeStatusConstants.Disabling).length,
      DownCount: this.nodes.filter(node => node.nodeStatus === NodeStatusConstants.Down).length
    };

    this.tiles = [
      DashboardViewModel.fromNodeStatusCount('Nodes', 'Node', false, nodeStatusCount)
    ];
  }

  private updateItemInEssentials(): void {
    this.essentialItems = [
      {
        descriptionName: 'Code Version',
        copyTextValue: this.uniqueCodeVersions.toString(),
        displayText: this.uniqueCodeVersions.toString(),
      },
      {
        descriptionName: 'Fault Domains',
        displayText: this.faultDomainCount.toString(),
        copyTextValue: this.faultDomainCount.toString()
      },
      {
        descriptionName: 'Upgrade Domains',
        displayText: this.upgradeDomainCount.toString(),
        copyTextValue: this.upgradeDomainCount.toString()
      },
      {
        descriptionName: 'Seed Nodes',
        displayText: this.seedNodes.length.toString(),
        copyTextValue: this.seedNodes.length.toString()
      }
    ];
  }

  private handleNodeClick(node: NodeDisplay): void {
    node.isSecondRowCollapsed = !node.isSecondRowCollapsed;
    if (!node.isSecondRowCollapsed && !node.detailsLoaded) {
      this.loadNodeDetails(node);
    }
  }

  private loadNodeDetails(node: NodeDisplay): void {
    forkJoin({
      systemServiceReplicasOnNode: this.restClient.getDeployedReplicasByApplication(node.name, 'System').pipe(catchError(() => of([]))),
      applicationsOnNode: this.restClient.getDeployedApplications(node.name).pipe(catchError(() => of([])))
    }).subscribe(({ systemServiceReplicasOnNode, applicationsOnNode }) => {
      const primaryCount = systemServiceReplicasOnNode.filter((r: any) => r.ReplicaRole === ReplicaRoles.Primary).length;
      const activeSecondaryCount = systemServiceReplicasOnNode.filter((r: any) => r.ReplicaRole === ReplicaRoles.ActiveSecondary).length;

      node.expandedDetails = {
        'System Services Primary Replicas Count': primaryCount.toString(),
        'System Services Active Secondary Replicas Count': activeSecondaryCount.toString(),
        'User Applications Count': applicationsOnNode.length.toString()
      };
      node.detailsLoaded = true;
    });
  }

}