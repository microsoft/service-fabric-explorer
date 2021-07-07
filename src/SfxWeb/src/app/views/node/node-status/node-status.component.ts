import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { NodeStatusConstants } from 'src/app/Common/Constants';
import { Node } from 'src/app/Models/DataModels/Node';
import { TimeUtils } from 'src/app/Utils/TimeUtils';

@Component({
  selector: 'app-node-status',
  templateUrl: './node-status.component.html',
  styleUrls: ['./node-status.component.scss']
})
export class NodeStatusComponent implements OnChanges {

  @Input() node: Node;

  duration: string;
  timestamp: string;
  up: boolean;
  constructor() {}

  ngOnChanges(): void {
    this.up = this.node.nodeStatus === NodeStatusConstants.Up;
    if (this.up) {
      this.duration = TimeUtils.getDurationFromSeconds(this.node.raw.NodeUpTimeInSeconds);
      this.timestamp = this.node.raw.NodeUpAt;
    }else{
      this.duration = TimeUtils.getDurationFromSeconds(this.node.raw.NodeDownTimeInSeconds);
      this.timestamp = this.node.raw.NodeDownAt;
    }
  }

}
