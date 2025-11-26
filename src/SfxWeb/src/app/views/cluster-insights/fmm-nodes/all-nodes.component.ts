import { Component, OnInit } from '@angular/core';
import { RestClientService } from 'src/app/services/rest-client.service';
import { SettingsService } from 'src/app/services/settings.service';
import { IRawNode, IRawNodeStatusCount } from 'src/app/Models/RawDataTypes';
import { ListSettings, ListColumnSettingForLink, ListColumnSetting, ListColumnSettingWithFilter, ListColumnSettingForBadge, ListColumnSettingForColoredNodeName } from 'src/app/Models/ListSettings';
import { IDashboardViewModel, DashboardViewModel } from 'src/app/ViewModels/DashboardViewModels';
import { IEssentialListItem } from 'src/app/modules/charts/essential-health-tile/essential-health-tile.component';

interface FMMNodeDisplay {
  name: string;
  raw: IRawNode;
  nodeStatusBadge: { text: string; badgeClass: string };
  nodeStatus: string;
}

@Component({
  selector: 'app-fmm-nodes',
  templateUrl: './all-nodes.component.html',
  styleUrls: ['./all-nodes.component.scss']
})
export class FMMNodesComponent implements OnInit {
  nodes: FMMNodeDisplay[] = [];
  seedNodes: FMMNodeDisplay[] = [];
  nonSeedNodes: FMMNodeDisplay[] = [];
  listSettings!: ListSettings;
  seedNodeCount: number = 0;
  faultDomainCount: number = 0;
  upgradeDomainCount: number = 0;
  uniqueCodeVersions: string[] = [];
  tiles: IDashboardViewModel[] = [];
  essentialItems: IEssentialListItem[] = [];

  constructor(
    private restClient: RestClientService, 
    private settings: SettingsService
  ) {}

  ngOnInit(): void {
    this.setupListSettings();
    this.loadFMMNodes();
  }

  setupListSettings(): void {
    this.listSettings = this.settings.getNewOrExistingListSettings('fmm-nodes', ['name'], [
      new ListColumnSettingForColoredNodeName('name', 'Name'),
      new ListColumnSetting('raw.IpAddressOrFQDN', 'Address'),
      new ListColumnSettingWithFilter('raw.Type', 'Node Type'),
      new ListColumnSettingWithFilter('raw.UpgradeDomain', 'Upgrade Domain'),
      new ListColumnSettingWithFilter('raw.FaultDomain', 'Fault Domain'),
      new ListColumnSettingWithFilter('raw.IsSeedNode', 'Is Seed Node'),
      new ListColumnSettingForBadge('nodeStatusBadge', 'Status'),
      new ListColumnSettingWithFilter('raw.Id.Id', 'Node Id'),
      new ListColumnSettingWithFilter('raw.CodeVersion', 'Code Version'),
    ]);
  }

  loadFMMNodes(): void {    
    this.restClient.getFMMNodes().subscribe({
      next: (rawNodes: IRawNode[]) => {
        // Map nodes to display format
        this.nodes = rawNodes.map(rawNode => {
          const nodeStatus = rawNode.NodeStatus || 'Unknown';
          
          return {
            name: rawNode.Name,
            raw: rawNode,
            nodeStatus: nodeStatus,
            nodeStatusBadge: this.getNodeStatusBadge(nodeStatus),
            viewPath: `#/node/${encodeURIComponent(rawNode.Name)}` // Construct viewPath manually
          };
        });

        // Separate seed and non-seed nodes
        this.seedNodes = this.nodes.filter(node => node.raw.IsSeedNode === true);
        this.nonSeedNodes = this.nodes.filter(node => node.raw.IsSeedNode === false);

        // Calculate statistics
        this.seedNodeCount = this.seedNodes.length;
        this.faultDomainCount = new Set(rawNodes.map(node => node.FaultDomain)).size;
        this.upgradeDomainCount = new Set(rawNodes.map(node => node.UpgradeDomain)).size;
        this.uniqueCodeVersions = [...new Set(rawNodes.map(node => node.CodeVersion))];
        this.updateItemInEssentials();

        // Update tiles based on node status
        this.updateTiles();
      },
      error: (err) => {
        // Error loading FMM nodes
      }
    });
  }

  getNodeStatusBadge(nodeStatus: string): { text: string; badgeClass: string } {
    // Map node status to badge
    if (nodeStatus === 'Up') {
      return { text: nodeStatus, badgeClass: 'badge-ok' };
    } else if (nodeStatus === 'Down') {
      return { text: 'Down', badgeClass: 'badge-error' };
    } else if (nodeStatus === 'Disabling' || nodeStatus === 'Disabled') {
      return { text: nodeStatus, badgeClass: 'badge-warning' };
    } else {
      return { text: nodeStatus, badgeClass: 'badge-unknown' };
    }
  }
  
  updateTiles(): void {
    this.tiles = [];
  
    // Count nodes by status
    const nodeStatusCount: IRawNodeStatusCount = {
      UpCount: this.nodes.filter(node => node.nodeStatus === 'Up').length,
      DisabledCount: this.nodes.filter(node => node.nodeStatus === 'Disabled' || node.nodeStatus === 'Disabling').length,
      DownCount: this.nodes.filter(node => node.nodeStatus === 'Down').length
    };
  
    // Create a tile using the fromNodeStatusCount method
    this.tiles.push(
      DashboardViewModel.fromNodeStatusCount('Nodes', 'Node', false, nodeStatusCount)
    );
  }

  updateItemInEssentials() {
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
}