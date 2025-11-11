import { Component, OnInit } from '@angular/core';
import { RestClientService } from '../../../services/rest-client.service';
import { SettingsService } from '../../../services/settings.service';
import { ListSettings, ListColumnSettingForLink, ListColumnSetting, ListColumnSettingWithFilter, ListColumnSettingForBadge } from '../../../Models/ListSettings';
import { IRawNode } from '../../../Models/RawDataTypes';

// Simple interface for FMM Node display
interface FMMNodeDisplay {
  name: string;
  viewPath: string;
  raw: IRawNode;
  healthState: string;
  nodeStatus: string;
}

@Component({
  selector: 'app-fmm-nodes',
  templateUrl: './all-nodes.component.html',
  styleUrls: ['./all-nodes.component.scss']
})
export class FMMNodesComponent implements OnInit {

  nodes: FMMNodeDisplay[] = [];
  listSettings!: ListSettings;
  tiles: any[] = [];
  isLoading: boolean = false;

  constructor(
    private restClient: RestClientService, 
    private settings: SettingsService
  ) { }

  ngOnInit() {
    console.log('FMMNodesComponent ngOnInit called');
    this.setupListSettings();
    this.loadFMMNodes();
  }

  setupListSettings(): void {
    console.log('Setting up FMM nodes list settings');
    this.listSettings = this.settings.getNewOrExistingListSettings('fmm-nodes', ['name'], [
      new ListColumnSettingForLink('name', 'Name', (item: any) => item.viewPath),
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

  loadFMMNodes(): void {
    console.log('Loading FMM nodes - calling API');
    this.isLoading = true;
    
    // Call the new /getFMMNodeList API
    this.restClient.getFMMNodes().subscribe({
      next: (rawNodes: IRawNode[]) => {
        console.log('FMM nodes loaded successfully:', rawNodes.length, 'nodes');
        // Transform raw nodes into display format
        this.nodes = rawNodes.map(rawNode => ({
          name: rawNode.Name,
          viewPath: `/node/${encodeURIComponent(rawNode.Name)}`, // Link to node details page
          raw: rawNode,
          healthState: rawNode.HealthState,
          nodeStatus: rawNode.NodeStatus
        }));

        this.calculateTiles();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading FMM nodes:', error);
        this.isLoading = false;
      }
    });
  }

  calculateTiles(): void {
    // Calculate node statistics for dashboard tiles
    const nodesByType: { [key: string]: { total: number, error: number, warning: number, ok: number } } = {};
    
    this.nodes.forEach(node => {
      const nodeType = node.raw.Type;
      
      if (!nodesByType[nodeType]) {
        nodesByType[nodeType] = { total: 0, error: 0, warning: 0, ok: 0 };
      }
      
      nodesByType[nodeType].total++;
      
      // Count by health state
      if (node.healthState === 'Error') {
        nodesByType[nodeType].error++;
      } else if (node.healthState === 'Warning') {
        nodesByType[nodeType].warning++;
      } else if (node.healthState === 'Ok') {
        nodesByType[nodeType].ok++;
      }
    });

    // Create tiles for each node type
    this.tiles = Object.keys(nodesByType).map(nodeType => ({
      name: nodeType,
      displayName: nodeType,
      count: nodesByType[nodeType].total,
      healthState: {
        errorCount: nodesByType[nodeType].error,
        warningCount: nodesByType[nodeType].warning,
        okCount: nodesByType[nodeType].ok
      }
    }));
  }
}
