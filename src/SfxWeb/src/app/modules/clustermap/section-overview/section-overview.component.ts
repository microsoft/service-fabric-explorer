import { Component, Input, OnInit } from '@angular/core';
import { NodeStatusConstants } from 'src/app/Common/Constants';
import { INodesStatusDetails, NodeStatusDetails } from 'src/app/Models/DataModels/collections/NodeCollection';
import { RepairTaskCollection } from 'src/app/Models/DataModels/collections/RepairTaskCollection';
import { Node } from 'src/app/Models/DataModels/Node';
import { ValueResolver } from 'src/app/Utils/ValueResolver';
import { DashboardDataPointViewModel, IDashboardDataPointViewModel } from 'src/app/ViewModels/DashboardViewModels';
import { IEssentialListItem } from '../../charts/essential-health-tile/essential-health-tile.component';

@Component({
  selector: 'app-section-overview',
  templateUrl: './section-overview.component.html',
  styleUrls: ['./section-overview.component.scss']
})
export class SectionOverviewComponent implements OnInit {
  @Input() nodes: Node[];
  @Input() repairJobs: RepairTaskCollection;
  @Input() title: string = '';
  @Input() moreInfo: boolean = true;
  @Input() vertical: boolean = true;
  info: INodesStatusDetails;
  item: IEssentialListItem[] = [];

  dataPoints: IDashboardDataPointViewModel[] = [];

  constructor() { }

  ngOnInit(): void {
    const nodeInfo = new NodeStatusDetails("");
    this.nodes.forEach(node => nodeInfo.add(node));
    this.info = nodeInfo;
    console.log(nodeInfo, nodeInfo.errorCount, nodeInfo.okCount, nodeInfo.warningCount)

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

    const dps: DashboardDataPointViewModel[] = [];
    dps.push(new DashboardDataPointViewModel('Error', nodeInfo.errorCount, ValueResolver.healthStatuses[3]));
    dps.push(new DashboardDataPointViewModel('Warning', nodeInfo.warningCount, ValueResolver.healthStatuses[2]));
    dps.push(new DashboardDataPointViewModel('Healthy', nodeInfo.okCount, ValueResolver.healthStatuses[1]));
    this.dataPoints = dps;
  }
}
