import { Component, Injector } from '@angular/core';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { RestClientService } from 'src/app/services/rest-client.service';
import { IRawNode, IRawNodeStatusCount } from 'src/app/Models/RawDataTypes';
import { ListSettings, ListColumnSetting, ListColumnSettingWithFilter, ListColumnSettingForBadge } from 'src/app/Models/ListSettings';
import { NodeStatusConstants, ReplicaRoles } from 'src/app/Common/Constants';
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
  systemPrimaryReplicasCount: number;
  expandedDetails?: Record<string, string>;
  icon?: { src: string; alt: string; title: string };
  color: string;
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

  override fixedRefreshIntervalMs = 60000; // 60 seconds

  constructor(private restClient: RestClientService, injector: Injector) {
    super(injector);
  }

  setup(): void {
    this.setupListSettings();
  }

  refresh(): Observable<any> {
    this.isLoading = true;
    return this.restClient.getNodes().pipe(
      switchMap(rawNodes => {
        const nodeDataRequests = rawNodes.map(rawNode =>
          forkJoin({
            systemServiceReplicasOnNode: this.restClient.getDeployedReplicasByApplication(rawNode.Name, 'System').pipe(catchError(() => of([]))),
            applicationsOnNode: this.restClient.getDeployedApplications(rawNode.Name).pipe(catchError(() => of([])))
          })
        );

        if (rawNodes.length === 0) {
          this.isLoading = false;
          return of(null);
        }

        return forkJoin(nodeDataRequests).pipe(
          map(nodeResults => {
            this.nodes = rawNodes.map((rawNode, i) => this.buildNodeDisplay(rawNode, nodeResults[i]));

            this.seedNodes = this.nodes.filter(node => node.raw.IsSeedNode);
            this.nonSeedNodes = this.nodes.filter(node => !node.raw.IsSeedNode);

            this.faultDomainCount = new Set(rawNodes.map(node => node.FaultDomain)).size;
            this.upgradeDomainCount = new Set(rawNodes.map(node => node.UpgradeDomain)).size;
            this.uniqueCodeVersions = [...new Set(rawNodes.map(node => node.CodeVersion))];

            this.updateItemInEssentials();
            this.updateTiles();
            this.isLoading = false;
          }),
          catchError(() => {
            this.isLoading = false;
            return of(null);
          })
        );
      }),
      catchError(() => {
        this.isLoading = false;
        return of(null);
      })
    );
  }

  private buildNodeDisplay(rawNode: IRawNode, replicaData: { systemServiceReplicasOnNode: any[]; applicationsOnNode: any[] }): NodeDisplay {
    const nodeStatus = rawNode.NodeStatus || NodeStatusConstants.Unknown;
    const { systemServiceReplicasOnNode, applicationsOnNode } = replicaData;
    const primaryCount = systemServiceReplicasOnNode.filter(r => r.ReplicaRole === ReplicaRoles.Primary).length;
    const activeSecondaryCount = systemServiceReplicasOnNode.filter(r => r.ReplicaRole === ReplicaRoles.ActiveSecondary).length;

    return {
      name: rawNode.Name,
      raw: rawNode,
      nodeStatus,
      nodeStatusBadge: this.getNodeStatusBadge(nodeStatus),
      isClickable: rawNode.NodeStatus === NodeStatusConstants.Up,
      isSecondRowCollapsed: true,
      systemPrimaryReplicasCount: primaryCount,
      expandedDetails: {
        'System Services Primary Replicas Count': primaryCount.toString(),
        'System Services ActiveSecondary Replicas Count': activeSecondaryCount.toString(),
        'User Applications Count': applicationsOnNode.length.toString()
      },
      color: this.getNodeColor(nodeStatus),
      icon: rawNode.IsSeedNode ? { src: 'assets/seed.svg', alt: 'Seed Node', title: 'Seed Node' } : undefined
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
      new ListColumnSetting('systemPrimaryReplicasCount', 'System Primary Replicas'),
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
        return { text: nodeStatus, badgeClass: 'badge-ok' };
      case NodeStatusConstants.Down:
        return { text: nodeStatus, badgeClass: 'badge-error' };
      case NodeStatusConstants.Disabling:
      case NodeStatusConstants.Disabled:
        return { text: nodeStatus, badgeClass: 'badge-warning' };
      default:
        return { text: nodeStatus, badgeClass: 'badge-unknown' };
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

  private getNodeColor(status: string): string {
    switch (status) {
      case NodeStatusConstants.Up: return 'var(--badge-ok)';
      case NodeStatusConstants.Down: return 'var(--badge-error)';
      case NodeStatusConstants.Disabling:
      case NodeStatusConstants.Disabled: return 'var(--badge-warning)';
      default: return 'var(--badge-unknown)';
    }
  }

  private handleNodeClick(node: NodeDisplay): void {
    if (node.isClickable) {
      node.isSecondRowCollapsed = !node.isSecondRowCollapsed;
    }
  }

}