// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, Input, OnChanges } from '@angular/core';
import { IRawRemoteReplicatorStatus } from 'src/app/Models/RawDataTypes';
import { IEssentialListItem } from '../../charts/essential-health-tile/essential-health-tile.component';

@Component({
  selector: 'app-replica-status',
  templateUrl: './replica-status.component.html',
  styleUrls: ['./replica-status.component.scss']
})
export class ReplicaStatusComponent implements OnChanges {

  @Input() replicator: IRawRemoteReplicatorStatus;
  copyItems: IEssentialListItem[] = [];
  replicationItems: IEssentialListItem[] = [];
  lastItems: IEssentialListItem[] = [];

  copy = false;

  constructor() { }

  ngOnChanges() {
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
        descriptionName: 'Received And Not Applied',
        copyTextValue: repRef.ReceivedAndNotAppliedCount,
        displayText: repRef.ReceivedAndNotAppliedCount,
      },
    ];

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
        descriptionName: 'Received And Not Applied',
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

  handleCollapseChange(state: boolean) {
    this.copy = !state;
  }

}
