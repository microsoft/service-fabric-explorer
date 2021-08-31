import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { IRawRemoteReplicatorStatus, IRemoteReplicatorAcknowledgementDetail } from 'src/app/Models/RawDataTypes';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { IEssentialListItem } from '../../charts/essential-health-tile/essential-health-tile.component';

@Component({
  selector: 'app-replica-status',
  templateUrl: './replica-status.component.html',
  styleUrls: ['./replica-status.component.scss']
})
export class ReplicaStatusComponent implements OnInit, OnChanges {

  @Input() replicator: IRawRemoteReplicatorStatus;
  copyItems: IEssentialListItem[] = [];
  replicationItems: IEssentialListItem[] = [];
  lastItems: IEssentialListItem[] = [];
  isCopying = false;
  isReplicating = false;

  replicationStatus = '';

  overallStatus = '';
  stepsFinished = 0;

  estimatedTime: string;

  constructor() { }

  ngOnInit(): void {
  }

  ngOnChanges() {
    this.isCopying = this.inProgress(this.replicator.RemoteReplicatorAcknowledgementStatus.CopyStreamAcknowledgementDetail);
    this.isReplicating = this.inProgress(this.replicator.RemoteReplicatorAcknowledgementStatus.ReplicationStreamAcknowledgementDetail);
    this.setCurrentStatus();
    this.replicationStatus = this.getReplicationStatus();

    const copyRef = this.replicator.RemoteReplicatorAcknowledgementStatus.CopyStreamAcknowledgementDetail;
    const repRef = this.replicator.RemoteReplicatorAcknowledgementStatus.ReplicationStreamAcknowledgementDetail;
    this.replicationItems = [
      {
        descriptionName: 'Average Receive Duration',
        copyTextValue: repRef.AverageReceiveDuration,
        displayText: repRef.AverageReceiveDuration,
      },
      {
        descriptionName: 'Average Apply Duration',
        copyTextValue: repRef.AverageApplyDuration,
        displayText: repRef.AverageApplyDuration,
      },
      {
        descriptionName: 'Not Received Count',
        copyTextValue: repRef.NotReceivedCount,
        displayText: repRef.NotReceivedCount,
      },
      {
        descriptionName: 'Received And Not Applied Count ',
        copyTextValue: repRef.ReceivedAndNotAppliedCount,
        displayText: repRef.ReceivedAndNotAppliedCount,
      },
    ]

    this.copyItems = [
      {
        descriptionName: 'Average Receive Duration',
        copyTextValue: copyRef.AverageReceiveDuration,
        displayText: copyRef.AverageReceiveDuration,
      },
      {
        descriptionName: 'Average Apply Duration',
        copyTextValue: copyRef.AverageApplyDuration,
        displayText: copyRef.AverageApplyDuration,
      },
      {
        descriptionName: 'Not Received Count',
        copyTextValue: copyRef.NotReceivedCount,
        displayText: copyRef.NotReceivedCount,
      },
      {
        descriptionName: 'Received And Not Applied Count ',
        copyTextValue: copyRef.ReceivedAndNotAppliedCount,
        displayText: copyRef.ReceivedAndNotAppliedCount,
      },
      {
        descriptionName: 'Last Received CSN',
        copyTextValue: this.replicator.LastReceivedCopySequenceNumber,
        displayText: this.replicator.LastReceivedCopySequenceNumber,
      },
      {
        descriptionName: 'Last Applied CSN',
        copyTextValue: this.replicator.LastAppliedCopySequenceNumber,
        displayText: this.replicator.LastAppliedCopySequenceNumber,
      },
    ];

    this.lastItems = [
      {
        descriptionName: 'Last Received LSN ',
        copyTextValue: this.replicator.LastReceivedReplicationSequenceNumber,
        displayText: this.replicator.LastReceivedReplicationSequenceNumber,
      },
      {
        descriptionName: 'Last Applied LSN ',
        copyTextValue: this.replicator.LastAppliedReplicationSequenceNumber,
        displayText: this.replicator.LastAppliedReplicationSequenceNumber,
      },
    ];
  }

  inProgress(details: IRemoteReplicatorAcknowledgementDetail): boolean {
    return (+details.NotReceivedCount + +details.ReceivedAndNotAppliedCount) > 0;
  }

  getReplicationStatus() {
    if (this.isCopying) {
      return 'Not Started';
    }

    if (this.isReplicating) {
      return this.estimatedTime;
    }
    return 'Complete';

  }

  setCurrentStatus() {

    if(this.replicator.IsInBuild) {
      if (this.isCopying) {
        this.overallStatus = 'Copying';
        this.estimatedTime = this.getEstimatedDuration(this.replicator.RemoteReplicatorAcknowledgementStatus.CopyStreamAcknowledgementDetail);
        this.stepsFinished = 0;
      } else if (this.isReplicating) {
        this.overallStatus = 'Replicating';
        this.estimatedTime = this.getEstimatedDuration(this.replicator.RemoteReplicatorAcknowledgementStatus.ReplicationStreamAcknowledgementDetail);
        this.stepsFinished = 1;
      }
    }else{
      this.overallStatus = 'Complete';
      this.stepsFinished = 2;
    }
  }

  getEstimatedDuration(details: IRemoteReplicatorAcknowledgementDetail) {
    // average apply duration * (received and not applied  +  not received) +  not received * average receive duration
    return TimeUtils.getDuration(+details.AverageApplyDuration * (+details.ReceivedAndNotAppliedCount + +details.NotReceivedCount) +
                                 +details.AverageReceiveDuration * +details.NotReceivedCount);
  }

}
