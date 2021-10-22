import { Component, Input, OnChanges, OnInit, Output, EventEmitter } from '@angular/core';
import { HealthStateConstants } from 'src/app/Common/Constants';
import { ReplicaOnPartition } from 'src/app/Models/DataModels/Replica';
import { IRawRemoteReplicatorStatus } from 'src/app/Models/RawDataTypes';
import { IEssentialListItem } from '../../charts/essential-health-tile/essential-health-tile.component';
import { ITimedReplication } from '../replica-status-container/replica-status-container.component';
import { IChartData } from '../replication-trend-line/replication-trend-line.component';

@Component({
  selector: 'app-replica-tile',
  templateUrl: './replica-tile.component.html',
  styleUrls: ['./replica-tile.component.scss']
})
export class ReplicaTileComponent implements OnInit, OnChanges {
  @Input() replica: ReplicaOnPartition;
  @Input() replicator: IRawRemoteReplicatorStatus;
  @Input() replicatorHistory: ITimedReplication[];

  @Input() showReplication = false;
  @Output() showReplicationChange = new EventEmitter<boolean>();

  overviewItems: IEssentialListItem[] = [];
  status: IEssentialListItem;

  leftBannerColor = '';
  fullScreen = false;
  chartData: IChartData[] = [];
  copyText = '';
  constructor() { }

  ngOnInit(): void {
  }

  ngOnChanges() {
    this.copyText = JSON.stringify(this.replica.raw, null, 4);
    this.overviewItems = [
      {
        descriptionName: 'ID',
        copyTextValue: this.replica.name,
        displayText: this.replica.name
      },
      {
        descriptionName: 'Role',
        copyTextValue: this.replica.role,
        displayText: this.replica.role,
      },
      {
        descriptionName: 'Node',
        copyTextValue: this.replica.raw.NodeName,
        displayText: this.replica.raw.NodeName,
      },
    ];

    this.status = {
      descriptionName: 'Status',
      copyTextValue: this.replica.raw.HealthState,
      displaySelector: true
    };

    let bannerColor = '';
    if (this.replica.healthState.text === HealthStateConstants.OK) {
      bannerColor = 'green';
    } else if (this.replica.healthState.text === HealthStateConstants.Warning) {
      bannerColor = 'yellow';
    } else if (this.replica.healthState.text === HealthStateConstants.Error) {
      bannerColor = 'red';
    } else {
      bannerColor = 'gray';
    }
    this.leftBannerColor = 'banner-' + bannerColor;

    if (this.replicatorHistory && this.replicatorHistory.length > 1) {
      this.chartData = this.replicatorHistory.map((value, index) => {
        if (index > 0) {
          const previous = this.replicatorHistory[index - 1];
          const duration = (value.date.getTime() - previous.date.getTime()) / 1000;
          const diff = (+value.LastAppliedReplicationSequenceNumber - +previous.LastAppliedReplicationSequenceNumber) / duration;
          return {
            delta: diff,
            date: value.date
          };
        } else {
          return {
            delta: 0,
            date: value.date
          };
        }
      });

      console.log(this)
    }
  }

  changeReplication() {
    this.showReplication = !this.showReplication;
    this.showReplicationChange.emit(this.showReplication);
  }

  changeFullScreen() {
    this.fullScreen = !this.fullScreen;
  }
}
