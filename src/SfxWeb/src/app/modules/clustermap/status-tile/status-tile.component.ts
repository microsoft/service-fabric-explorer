import { Component, Input, OnInit } from '@angular/core';
import { NodeStatusConstants } from 'src/app/Common/Constants';
import { INodesStatusDetails, NodeStatusDetails } from 'src/app/Models/DataModels/collections/NodeCollection';
import { RepairTaskCollection } from 'src/app/Models/DataModels/collections/RepairTaskCollection';
import { Node } from 'src/app/Models/DataModels/Node';
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
  @Input() moreInfo: boolean = true;
  @Input() vertical: boolean = true;
  info: INodesStatusDetails;
  item: IEssentialListItem[] = [];

  constructor() { }

  ngOnInit(): void {
    const nodeInfo = new NodeStatusDetails("");
    this.nodes.forEach(node => nodeInfo.add(node));
    this.info = nodeInfo;
    console.log(nodeInfo)

    this.item = [
      {
        descriptionName: 'Disabled',
        copyTextValue: this.info.statusTypeCounts[NodeStatusConstants.Disabled].toString(),
        displayText: this.info.statusTypeCounts[NodeStatusConstants.Disabled].toString()
      },
      {
        descriptionName: 'Disabling',
        copyTextValue: this.info.statusTypeCounts[NodeStatusConstants.Disabling].toString(),
        displayText: this.info.statusTypeCounts[NodeStatusConstants.Disabled].toString()
      },
      {
        descriptionName: 'Down',
        copyTextValue: this.info.statusTypeCounts[NodeStatusConstants.Down].toString(),
        displayText: this.info.statusTypeCounts[NodeStatusConstants.Down].toString()
      },
      {
        descriptionName: 'Repair jobs',
        copyTextValue: this.info.statusTypeCounts[NodeStatusConstants.Down].toString(),
        displayText: this.info.statusTypeCounts[NodeStatusConstants.Down].toString()
      },
    ]
  }

}
