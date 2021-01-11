import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { IRawReplicatorStatus, IRawRemoteReplicatorStatus, IRemoteReplicatorAcknowledgementDetail, IRemoteReplicatorAcknowledgementStatus } from 'src/app/Models/RawDataTypes';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { Utils } from 'src/app/Utils/Utils';
import { ReplicaOnPartition } from 'src/app/Models/DataModels/Replica';

@Component({
  selector: 'app-replica-status',
  templateUrl: './replica-status.component.html',
  styleUrls: ['./replica-status.component.scss']
})
export class ReplicaStatusComponent implements OnInit, OnChanges {

  @Input() replicator: IRawRemoteReplicatorStatus;
  @Input() replica: ReplicaOnPartition;

  isCopying = false;
  isReplicating = false;

  replicationStatus = '';

  overallStatus = '';
  stepsFinished = 0;

  leftBannerColor = '';

  estimatedTime: string;

  copyText = '';

  constructor() { }

  ngOnInit(): void {
    console.log(this.replica);
  }

  ngOnChanges() {
    this.isCopying = this.inProgress(this.replicator.RemoteReplicatorAcknowledgementStatus.CopyStreamAcknowledgementDetail);
    this.isReplicating = this.inProgress(this.replicator.RemoteReplicatorAcknowledgementStatus.ReplicationStreamAcknowledgementDetail);
    this.setCurrentStatus();
    this.replicationStatus = this.getReplicationStatus();
    this.copyText = Utils.objectToFormattedText(this.replicator);
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
    this.leftBannerColor = 'blue-border';

    if (this.isCopying) {
      this.overallStatus = 'Copying';
      this.estimatedTime = this.getEstimatedDuration(this.replicator.RemoteReplicatorAcknowledgementStatus.CopyStreamAcknowledgementDetail);
      this.stepsFinished = 0;
    } else if (this.isReplicating) {
      this.overallStatus = 'Replicating';
      this.estimatedTime = this.getEstimatedDuration(this.replicator.RemoteReplicatorAcknowledgementStatus.ReplicationStreamAcknowledgementDetail);
      this.stepsFinished = 1;
    } else {
      this.overallStatus = 'Complete';
      this.leftBannerColor = 'green-border';
      this.stepsFinished = 2;
    }
  }

  getEstimatedDuration(details: IRemoteReplicatorAcknowledgementDetail) {
    // average apply duration * (received and not applied  +  not received) +  not received * average receive duration
    return TimeUtils.getDuration(+details.AverageApplyDuration * (+details.ReceivedAndNotAppliedCount + +details.NotReceivedCount) +
                                 +details.AverageReceiveDuration * +details.NotReceivedCount);
  }

}
