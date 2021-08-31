import { Component, Input, OnChanges, OnInit, Output, EventEmitter } from '@angular/core';
import { HealthStateConstants } from 'src/app/Common/Constants';
import { ReplicaOnPartition } from 'src/app/Models/DataModels/Replica';
import { IRawRemoteReplicatorStatus } from 'src/app/Models/RawDataTypes';
import { IEssentialListItem } from '../../charts/essential-health-tile/essential-health-tile.component';

@Component({
  selector: 'app-replica-tile',
  templateUrl: './replica-tile.component.html',
  styleUrls: ['./replica-tile.component.scss']
})
export class ReplicaTileComponent implements OnInit, OnChanges {
  @Input() replica: ReplicaOnPartition;
  @Input() replicator: IRawRemoteReplicatorStatus;
  @Input() replicatorHistory: IRawRemoteReplicatorStatus[];

  @Input() showReplication: boolean = false;
  @Output() showReplicationChange = new EventEmitter<boolean>();

  overviewItems: IEssentialListItem[] = [];
  status: IEssentialListItem;
  copyText = '';
  leftBannerColor = '';

  chartData = [];

  constructor() { }

  ngOnInit(): void {
  }

  ngOnChanges() {
    this.overviewItems = [
      {
        descriptionName: 'ID',
        copyTextValue: this.replica.name,
        displayText:  this.replica.name
      },
      {
        descriptionName: 'Role',
        copyTextValue: this.replica.role,
        displayText:  this.replica.role,
      },
      {
        descriptionName: 'Node',
        copyTextValue: this.replica.raw.NodeName,
        displayText:  this.replica.raw.NodeName,
      },
    ]

    this.status =       {
      descriptionName: 'Status',
      copyTextValue: this.replica.raw.HealthState,
      displaySelector: true
    }

    if(this.replica.healthState.text === HealthStateConstants.OK) {
      this.leftBannerColor = "green";
    }else if(this.replica.healthState.text === "Warning") {
      this.leftBannerColor = "yellow"
    }else if(this.replica.healthState.text === "Warning") {
      this.leftBannerColor = "red"
    }else {
      this.leftBannerColor = "gray"
    }
    this.leftBannerColor = "banner-" + this.leftBannerColor

    console.log(this.replicatorHistory)
    if(this?.replicatorHistory?.length > 1) {
      this.chartData = this.replicatorHistory.map( (value, index) => {
        if(index > 0) {
          return +value.LastAppliedReplicationSequenceNumber - +this.replicatorHistory[index - 1].LastAppliedReplicationSequenceNumber;
        }else{
          return 0
        }
      }).slice(1)

    }
  }

  changeReplication() {
    this.showReplication = !this.showReplication;
    this.showReplicationChange.emit(this.showReplication)
  }
}
