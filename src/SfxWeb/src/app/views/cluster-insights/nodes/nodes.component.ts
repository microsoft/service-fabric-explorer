import { Component, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { RestClientService } from 'src/app/services/rest-client.service';
import { IRawNode, IRawNodeStatusCount } from 'src/app/Models/RawDataTypes';
import { ListSettings, ListColumnSetting, ListColumnSettingWithFilter, ListColumnSettingForBadge, ListColumnSettingForColoredNodeName } from 'src/app/Models/ListSettings';
import { IDashboardViewModel, DashboardViewModel } from 'src/app/ViewModels/DashboardViewModels';
import { IEssentialListItem } from 'src/app/modules/charts/essential-health-tile/essential-health-tile.component';

interface NodeDisplay {
  name: string;
  raw: IRawNode;
  nodeStatusBadge: { text: string; badgeClass: string };
  nodeStatus: string;
  isClickable: boolean;
  isSecondRowCollapsed: boolean;
  deployedReplicas: any[];
  systemPrimaryReplicasCount: number;
  deployedReplicaCounts?: Record<string, string>;
}

@Component({
  selector: 'app-nodes',
  templateUrl: './nodes.component.html',
  styleUrls: ['./nodes.component.scss']
})
export class NodesComponent implements OnInit {
  nodes: NodeDisplay[] = [];
  seedNodes: NodeDisplay[] = [];
  nonSeedNodes: NodeDisplay[] = [];
  listSettings!: ListSettings;
  seedNodeCount = 0;
  faultDomainCount = 0;
  upgradeDomainCount = 0;
  uniqueCodeVersions: string[] = [];
  tiles: IDashboardViewModel[] = [];
  essentialItems: IEssentialListItem[] = [];
  isLoading = true;

  constructor(private restClient: RestClientService) {}

  ngOnInit(): void {
    this.setupListSettings();
    this.loadNodes();
  }

  setupListSettings(): void {
    const clickHandler = this.handleNodeClick.bind(this);

    const columnSettings = [
      new ListColumnSettingWithExpandableLink('name', 'Name', clickHandler, 'nodeStatus', true),
      new ListColumnSetting('raw.IpAddressOrFQDN', 'Address'),
      new ListColumnSettingWithFilter('raw.Type', 'Node Type'),
      new ListColumnSettingWithFilter('raw.UpgradeDomain', 'Upgrade Domain'),
      new ListColumnSettingWithFilter('raw.FaultDomain', 'Fault Domain'),
      new ListColumnSettingWithFilter('raw.IsSeedNode', 'Is Seed Node'),
      new ListColumnSettingForBadge('nodeStatusBadge', 'Status'),
      new ListColumnSetting('systemPrimaryReplicasCount', 'System Primary Replicas'), // Showing the number of primary replica of system services running on the node, 
      new ListColumnSettingWithFilter('raw.Id.Id', 'Node Id'),
      new ListColumnSettingWithFilter('raw.CodeVersion', 'Code Version')
    ];

    const secondRowColumnSettings = [
      new ListColumnSettingForExpandedDetails('deployedReplicaCounts', 'Deployed Replicas', { colspan: -1 })
    ];

    this.listSettings = new ListSettings(
      15,
      null,
      'nodes',
      columnSettings,
      secondRowColumnSettings,
      true,
      (item) => item.isClickable && item.deployedReplicas.length > 0,
      true,  // searchable
      false  // showRowExpander
    );
  }

  loadNodes(): void {
    this.isLoading = true;
    this.restClient.getNodes().subscribe({
      next: (rawNodes: IRawNode[]) => {
        this.nodes = rawNodes.map(rawNode => {
          const nodeStatus = rawNode.NodeStatus || 'Unknown';
          return {
            name: rawNode.Name,
            raw: rawNode,
            nodeStatus,
            nodeStatusBadge: this.getNodeStatusBadge(nodeStatus),
            isClickable: rawNode.NodeStatus === 'Up',
            isSecondRowCollapsed: true,
            deployedReplicas: [],
            systemPrimaryReplicasCount: 0
          };
        });

        this.seedNodes = this.nodes.filter(node => node.raw.IsSeedNode);
        this.nonSeedNodes = this.nodes.filter(node => !node.raw.IsSeedNode);

        this.seedNodeCount = this.seedNodes.length;
        this.faultDomainCount = new Set(rawNodes.map(node => node.FaultDomain)).size;
        this.upgradeDomainCount = new Set(rawNodes.map(node => node.UpgradeDomain)).size;
        this.uniqueCodeVersions = [...new Set(rawNodes.map(node => node.CodeVersion))];

        this.updateItemInEssentials();
        this.updateTiles();
        
        this.loadReplicaCountsForAllNodes();
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  private loadReplicaCountsForAllNodes(): void {
    const countRequests = this.nodes.map(node =>
      forkJoin({
        systemServiceReplicas: this.restClient.getDeployedReplicasByApplication(node.name, 'System').pipe(
          catchError(() => of([]))
        ),
        applications: this.restClient.getDeployedApplications(node.name).pipe(
          catchError(() => of([]))
        )
      }).pipe(
        catchError(() => of({ systemServiceReplicas: [], applications: [] })),
        map(result => ({ node, ...result }))
      )
    );

    forkJoin(countRequests).subscribe({
      next: (results) => {
        results.forEach(({ node, systemServiceReplicas, applications }) => {
          const primaryCount = systemServiceReplicas.filter(r => r.ReplicaRole === 'Primary').length;
          const activeSecondaryCount = systemServiceReplicas.filter(r => r.ReplicaRole === 'ActiveSecondary').length;

          node.systemPrimaryReplicasCount = primaryCount;
          node.deployedReplicas = systemServiceReplicas;

          node.deployedReplicaCounts = {
            'System Services Primary Count': primaryCount.toString(),
            'System Services ActiveSecondary Count': activeSecondaryCount.toString(),
            'User Applications Count': applications.length.toString()
          };
        });
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  getNodeStatusBadge(nodeStatus: string): { text: string; badgeClass: string } {
    switch (nodeStatus) {
      case 'Up':
        return { text: nodeStatus, badgeClass: 'badge-ok' };
      case 'Down':
        return { text: nodeStatus, badgeClass: 'badge-error' };
      case 'Disabling':
      case 'Disabled':
        return { text: nodeStatus, badgeClass: 'badge-warning' };
      default:
        return { text: nodeStatus, badgeClass: 'badge-unknown' };
    }
  }

  updateTiles(): void {
    const nodeStatusCount: IRawNodeStatusCount = {
      UpCount: this.nodes.filter(node => node.nodeStatus === 'Up').length,
      DisabledCount: this.nodes.filter(node => node.nodeStatus === 'Disabled' || node.nodeStatus === 'Disabling').length,
      DownCount: this.nodes.filter(node => node.nodeStatus === 'Down').length
    };

    this.tiles = [
      DashboardViewModel.fromNodeStatusCount('Nodes', 'Node', false, nodeStatusCount)
    ];
  }

  updateItemInEssentials(): void {
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
        displayText: this.seedNodeCount.toString(),
        copyTextValue: this.seedNodeCount.toString()
      }
    ];
  }

  private handleNodeClick(node: NodeDisplay): void {
    if (!node.isClickable) {
      return;
    }
    
    node.isSecondRowCollapsed = !node.isSecondRowCollapsed;
  }

}