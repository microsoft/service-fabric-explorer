// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, Input, OnChanges, OnInit, TemplateRef } from '@angular/core';
import { NodeStatusConstants } from 'src/app/Common/Constants';
import { NodeStatusDetails } from 'src/app/Models/DataModels/collections/NodeCollection';
import { RepairTaskCollection } from 'src/app/Models/DataModels/collections/RepairTaskCollection';
import { Node } from 'src/app/Models/DataModels/Node';
import { IEssentialListItem } from '../../charts/essential-health-tile/essential-health-tile.component';

@Component({
  selector: 'app-status-tile',
  templateUrl: './status-tile.component.html',
  styleUrls: ['./status-tile.component.scss']
})
export class StatusTileComponent implements OnChanges {

  @Input() listTemplate: TemplateRef<any>;

  @Input() nodes: Node[];
  @Input() repairJobs: RepairTaskCollection;
  @Input() groupByNodeType = false;
  @Input() title = '';
  items: IEssentialListItem[] = [];

  nodeTypes = {};
  public constants = NodeStatusConstants;

  constructor() { }

  ngOnChanges(): void {
    if (this.groupByNodeType) {
      this.nodeTypes = {};
      this.nodes.forEach(node => {
        if (!this.nodeTypes[node.raw.Type]) {
          this.nodeTypes[node.raw.Type] = new NodeStatusDetails(node.raw.Type);
        }
        this.nodeTypes[node.raw.Type].add(node);
      });
    }else{
      this.items = this.nodes.map(item => {
        return {
          descriptionName: item.name,
          displaySelector: true
        };
      });
    }
  }

  trackByFn(index, node: any) {
    return node.key;
  }
}
