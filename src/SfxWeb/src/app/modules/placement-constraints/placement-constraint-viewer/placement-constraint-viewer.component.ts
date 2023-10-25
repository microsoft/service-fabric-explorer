import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { INodeTypeInfo } from 'src/app/Models/DataModels/Cluster';
import { Node } from 'src/app/Models/DataModels/Node';
import { ListColumnSetting, ListColumnSettingForBadge, ListColumnSettingWithCustomComponent, ListColumnSettingWithFilter, ListSettings } from 'src/app/Models/ListSettings';
import { SettingsService } from 'src/app/services/settings.service';
import { PlacementConstraintResultComponent } from '../placement-constraint-result/placement-constraint-result.component';

export interface IConstraint {
  name: string;
  result: boolean,
  fails: string[];
  node: Node;
  constraints: Record<string, string>;
  isSecondRowCollapsed: boolean;
}

@Component({
  selector: 'app-placement-constraint-viewer',
  templateUrl: './placement-constraint-viewer.component.html',
  styleUrls: ['./placement-constraint-viewer.component.scss']
})
export class PlacementConstraintViewerComponent implements OnInit, OnChanges {

  @Input() placementConstraints: string;
  @Input() nodes: Node[];
  @Input() blockList: any[];
  @Input() nodeTypeInfo: INodeTypeInfo[] = [];

  validListSettings: ListSettings;
  invalidListSettings: ListSettings;

  validNodes: IConstraint[] = [];
  invalidNodes: IConstraint[] = [];

  validUpNodes: number = 0;
  validUnavailableNodes: number = 0;

  constructor(private settingsService: SettingsService) { }

  ngOnInit(): void {
    this.validListSettings = this.settingsService.getNewOrExistingListSettings("validplacementConstraints", [""],
    [
      new ListColumnSetting("name", "Node"),
      new ListColumnSetting("node.raw.Type", "Node Type"),
      new ListColumnSettingForBadge('node.healthState', 'Health State'),
      new ListColumnSettingWithFilter('node.nodeStatus', 'Status'),
    ],
    [
      new ListColumnSettingWithCustomComponent(PlacementConstraintResultComponent),
    ]);

    this.invalidListSettings = this.settingsService.getNewOrExistingListSettings("invalidplacementConstraints", [""],
    [
      new ListColumnSetting("name", "Node"),
      new ListColumnSetting("node.raw.Type", "Node Type"),
      new ListColumnSettingForBadge('node.healthState', 'Health State'),
      new ListColumnSettingWithFilter('node.nodeStatus', 'Status'),
      new ListColumnSetting("constraint violation", "constraint violation"),
    ],
    [
      new ListColumnSettingWithCustomComponent(PlacementConstraintResultComponent),
    ],
    true)
  }

  ngOnChanges(changes: SimpleChanges): void {
    let blockedNodesSet = new Set(this.blockList.map(item => item.NodeName));

    let nodeTypeMap = {};
    this.nodeTypeInfo.forEach(nodeType => {
      nodeTypeMap[nodeType.name] = nodeType.placementProperties;
    })
    const isCollapsedMap = this.validNodes.concat(this.invalidNodes).reduce((map, item) => {map[item.name] = item.isSecondRowCollapsed; return map}, {});
    this.validNodes = [];
    this.invalidNodes = [];

    this.nodes.forEach(node => {
      const constraintInfo: IConstraint = {
        name: node.name,
        result: blockedNodesSet.has(node.name),
        fails: [""], //TODO set this correctly
        node,
        constraints: nodeTypeMap[node.raw.Type],
        isSecondRowCollapsed: node.name in isCollapsedMap ? isCollapsedMap[node.name] : true
      }

      if(constraintInfo.result) {
        this.validNodes.push(constraintInfo);
      }else{
        this.invalidNodes.push(constraintInfo);
      }
    })
  }
}
