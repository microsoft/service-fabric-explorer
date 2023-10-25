import { Component, Input, OnInit } from '@angular/core';
import { NodeStatusConstants } from 'src/app/Common/Constants';
import { NodeStatusDetails } from 'src/app/Models/DataModels/collections/NodeCollection';
import { INodesStatusDetails } from 'src/app/Models/RawDataTypes';
import { ValueResolver } from 'src/app/Utils/ValueResolver';
import { DashboardDataPointViewModel, IDashboardDataPointViewModel } from 'src/app/ViewModels/DashboardViewModels';
import { IEssentialListItem } from '../../charts/essential-health-tile/essential-health-tile.component';
import { IConstraint } from '../placement-constraint-viewer/placement-constraint-viewer.component';

@Component({
  selector: 'app-quick-view',
  templateUrl: './quick-view.component.html',
  styleUrls: ['./quick-view.component.scss']
})
export class QuickViewComponent implements OnInit {
  @Input() placementInfo: IConstraint[];

  info: INodesStatusDetails;
  dataPoints: IDashboardDataPointViewModel[] = [];
  items: IEssentialListItem[] = [];

  constructor() { }

  ngOnInit(): void {
    const nodeInfo = new NodeStatusDetails('');
    this.placementInfo.forEach(node => nodeInfo.add(node.node));
    this.info = nodeInfo;

    const dps: DashboardDataPointViewModel[] = [];
    dps.push(new DashboardDataPointViewModel('Error', nodeInfo.errorCount, ValueResolver.healthStatuses[3]));
    dps.push(new DashboardDataPointViewModel('Warning', nodeInfo.warningCount, ValueResolver.healthStatuses[2]));
    dps.push(new DashboardDataPointViewModel('Healthy', nodeInfo.okCount, ValueResolver.healthStatuses[1]));
    this.dataPoints = dps;

    this.items = [
      {
        descriptionName: 'Disabled Nodes',
        displayText: this.info.statusTypeCounts[NodeStatusConstants.Disabled].toString(),
        copyTextValue: this.info.statusTypeCounts[NodeStatusConstants.Disabled].toString(),
      },
      {
        descriptionName: 'Disabling Nodes',
        displayText: this.info.statusTypeCounts[NodeStatusConstants.Disabling].toString(),
        copyTextValue: this.info.statusTypeCounts[NodeStatusConstants.Disabling].toString(),
      },
    ]
  }

}
