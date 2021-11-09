import { Component, Input, OnInit } from '@angular/core';
import { NodeStatusConstants } from 'src/app/Common/Constants';
import { INodesStatusDetails, NodeStatusDetails } from 'src/app/Models/DataModels/collections/NodeCollection';
import { RepairTaskCollection } from 'src/app/Models/DataModels/collections/RepairTaskCollection';
import { Node } from 'src/app/Models/DataModels/Node';
import { ValueResolver } from 'src/app/Utils/ValueResolver';
import { DashboardDataPointViewModel, IDashboardDataPointViewModel } from 'src/app/ViewModels/DashboardViewModels';
import { IEssentialListItem } from '../../charts/essential-health-tile/essential-health-tile.component';

@Component({
  selector: 'app-status-tile',
  templateUrl: './status-tile.component.html',
  styleUrls: ['./status-tile.component.scss']
})
export class StatusTileComponent implements OnInit {

  @Input() nodes: Node[];
  @Input() repairJobs: RepairTaskCollection;
  @Input() title: string = '';
  items: IEssentialListItem[] = [];

  constructor() { }

  ngOnInit(): void {
    // this.nodes[0].viewPath
    this.items = this.nodes.map(item => {
      return {
        descriptionName: item.name,
        // copyTextValue: this.info.statusTypeCounts[NodeStatusConstants.Disabled].toString(),
        // displayText: this.info.statusTypeCounts[NodeStatusConstants.Disabled].toString(),
        displaySelector: true
      }
    })
    // [
    //   {
    //     descriptionName: 'Disabled',
    //     copyTextValue: this.info.statusTypeCounts[NodeStatusConstants.Disabled].toString(),
    //     displayText: this.info.statusTypeCounts[NodeStatusConstants.Disabled].toString()
    //   },
    // ]

  }
}
