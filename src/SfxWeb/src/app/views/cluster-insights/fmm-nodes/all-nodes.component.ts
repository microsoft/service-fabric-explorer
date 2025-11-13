import { Component, OnInit } from '@angular/core';
import { RestClientService } from 'src/app/services/rest-client.service';
import { SettingsService } from '../../../services/settings.service';
import { ListSettings, ListColumnSettingForLink, ListColumnSetting, ListColumnSettingWithFilter, ListColumnSettingForBadge } from '../../../Models/ListSettings';
import { IRawNode } from '../../../Models/RawDataTypes';
import { IDashboardViewModel } from 'src/app/ViewModels/DashboardViewModels';

// Simple interface for FMM Node display
interface FMMNodeDisplay {
  //name: string;
  //viewPath: string;
  raw: IRawNode;
  //healthState: string;
  //nodeStatus: string;
}

@Component({
  selector: 'app-fmm-nodes',
  templateUrl: './all-nodes.component.html',
  styleUrls: ['./all-nodes.component.scss']
})
export class FMMNodesComponent implements OnInit {

  nodes: FMMNodeDisplay[] = [];
  listSettings!: ListSettings;
  seedNodeCount: number = 0;
  faultDomainCount: number = 0;
  upgradeDomainCount: number = 0;
  uniqueCodeVersions: string[] = [];
  nodeStatusTile: IDashboardViewModel;
  //tiles: any[] = [];
  //isLoading: boolean = false;

  constructor(
    private restClient: RestClientService, 
    private settings: SettingsService
  ) {
    // Initialize with empty tile
    this.nodeStatusTile = {
      displayTitle: 'Nodes',
      largeTile: false,
      count: 0,
      viewPath: '',
      dataPoints: [],
      onClick: () => {},
      getDataPointTooltip: (dp) => `${dp.title}: ${dp.count}`
    };
  }

  ngOnInit() {
    console.log('FMMNodesComponent ngOnInit called');
    this.setupListSettings();
    this.loadFMMNodes();
  }

  setupListSettings(): void {
    console.log('Setting up FMM nodes list settings');
    this.listSettings = this.settings.getNewOrExistingListSettings('fmm-nodes', ['name'], [
      new ListColumnSettingWithFilter('raw.Name', 'Name'),
      new ListColumnSetting('raw.IpAddressOrFQDN', 'Address'),
      new ListColumnSettingWithFilter('raw.Type', 'Node Type'),
      new ListColumnSettingWithFilter('raw.UpgradeDomain', 'Upgrade Domain'),
      new ListColumnSettingWithFilter('raw.FaultDomain', 'Fault Domain'),
      new ListColumnSettingWithFilter('raw.IsSeedNode', 'Is Seed Node'),
      //new ListColumnSettingForBadge('healthState', 'Health State'),
      new ListColumnSettingWithFilter('nodeStatus', 'Status'),
      new ListColumnSettingWithFilter('raw.Id.Id', 'Node Id'),
      new ListColumnSettingWithFilter('raw.CodeVersion', 'Code Version'),
    ]);

    //this.listSettings = new ListSettings(10, ['name'], 'fmm-nodes', this.listSettings.columnSettings);
  }

  loadFMMNodes(): void {
    console.log('Loading FMM nodes - calling API');
    //this.isLoading = true;
    
    // Call the new /getFMMNodeList API
    this.restClient.getFMMNodes().subscribe({
      next: (rawNodes: IRawNode[]) => {
        console.log('FMM nodes loaded successfully:', rawNodes.length, 'nodes');
        
        // Calculate statistics
        this.calculateStatistics(rawNodes);
        
        // Transform raw nodes into display format
        this.nodes = rawNodes.map(rawNode => ({
          name: rawNode.Name,
          //viewPath: `/node/${encodeURIComponent(rawNode.Name)}`, // Link to node details page
          raw: rawNode,
          //healthState: rawNode.HealthState,
          nodeStatus: rawNode.NodeStatus
        }));

        //this.calculateTiles();
        //this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading FMM nodes:', error);
        //this.isLoading = false;
      }
    });
  }

  calculateStatistics(rawNodes: IRawNode[]): void {
    // Count seed nodes
    this.seedNodeCount = rawNodes.filter(node => node.IsSeedNode).length;

    // Count unique fault domains
    const faultDomains = new Set(rawNodes.map(node => node.FaultDomain));
    this.faultDomainCount = faultDomains.size;

    // Count unique upgrade domains
    const upgradeDomains = new Set(rawNodes.map(node => node.UpgradeDomain));
    this.upgradeDomainCount = upgradeDomains.size;

    // Get unique code versions
    const codeVersions = new Set(rawNodes.map(node => node.CodeVersion).filter(v => v));
    this.uniqueCodeVersions = Array.from(codeVersions).sort();

    console.log('Statistics calculated:', {
      seedNodeCount: this.seedNodeCount,
      faultDomainCount: this.faultDomainCount,
      upgradeDomainCount: this.upgradeDomainCount,
      uniqueCodeVersions: this.uniqueCodeVersions
    });

    // Calculate node status for ring chart
    const upNodes = rawNodes.filter(node => node.NodeStatus === 'Up').length;
    const downNodes = rawNodes.filter(node => node.NodeStatus === 'Disabled').length;
    
    this.nodeStatusTile = {
      displayTitle: 'Nodes',
      largeTile: false,
      count: rawNodes.length,
      viewPath: '',
      dataPoints: [
        {
          state: { text: 'Up', badgeClass: 'badge-ok', badgeId: 'up' },
          title: 'Up',
          count: upNodes,
          adjustedCount: upNodes
        },
        {
          state: { text: 'Disabled', badgeClass: 'badge-error', badgeId: 'down' },
          title: 'Disabled',
          count: downNodes,
          adjustedCount: downNodes
        }
      ],
      onClick: () => {},
      getDataPointTooltip: (dp) => `${dp.state.text}: ${dp.count}`
    };
  }

  // calculateTiles(): void {
  //   // Calculate node statistics for dashboard tiles
  //   const nodesByType: { [key: string]: { total: number, error: number, warning: number, ok: number } } = {};
    
  //   this.nodes.forEach(node => {
  //     const nodeType = node.raw.Type;
      
  //     if (!nodesByType[nodeType]) {
  //       nodesByType[nodeType] = { total: 0, error: 0, warning: 0, ok: 0 };
  //     }
      
  //     nodesByType[nodeType].total++;
      
  //     // Count by health state
  //     if (node.healthState === 'Error') {
  //       nodesByType[nodeType].error++;
  //     } else if (node.healthState === 'Warning') {
  //       nodesByType[nodeType].warning++;
  //     } else if (node.healthState === 'Ok') {
  //       nodesByType[nodeType].ok++;
  //     }
  //   });

  //   // Create tiles for each node type
  //   this.tiles = Object.keys(nodesByType).map(nodeType => ({
  //     name: nodeType,
  //     displayName: nodeType,
  //     count: nodesByType[nodeType].total,
  //     healthState: {
  //       errorCount: nodesByType[nodeType].error,
  //       warningCount: nodesByType[nodeType].warning,
  //       okCount: nodesByType[nodeType].ok
  //     }
  //   }));
  // }
}
