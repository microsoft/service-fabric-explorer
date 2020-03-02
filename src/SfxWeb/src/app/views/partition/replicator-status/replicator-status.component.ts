import { Component, OnInit, Input } from '@angular/core';
import { SettingsService } from 'src/app/services/settings.service';
import { ListSettings, ListColumnSetting } from 'src/app/Models/ListSettings';
import { IRawReplicatorStatus, IRemoteReplicatorAcknowledgementDetail, IRemoteReplicatorAcknowledgementStatus } from 'src/app/Models/RawDataTypes';

@Component({
  selector: 'app-replicator-status',
  templateUrl: './replicator-status.component.html',
  styleUrls: ['./replicator-status.component.scss']
})
export class ReplicatorStatusComponent implements OnInit {

  @Input() replicatorData: IRawReplicatorStatus;

  public listSettings: ListSettings;

  constructor(private settings: SettingsService) { }

  ngOnInit(): void {
    // this.replicatorData.remoteReplicators;
    console.log(this.replicatorData)
    this.listSettings = this.settings.getNewOrExistingListSettings("ReplicatorStatus", [], [
      new ListColumnSetting("ReplicaId", "Id"),
      // new ListColumnSetting("LastReceivedReplicationSequenceNumber", "LastReceivedReplicationSequenceNumber"),
      new ListColumnSetting("LastAppliedReplicationSequenceNumber", "LSN"),
      // new ListColumnSetting("CommittedSequenceNumber", "CommittedSequenceNumber"),
      new ListColumnSetting("RemoteReplicatorAcknowledgementStatus.CopyStreamAcknowledgementDetail.AverageApplyDuration", "Average Apply Duration"),
      new ListColumnSetting("LastAcknowledgementProcessedTimeUtc", "Last Acked Processed Time"),
      new ListColumnSetting("LastAcknowledgementProcessedTimeUtc", "LastAcknowledgementProcessedTimeUtc"),
    ]);

    //replica id
    // LastSequenceNumber
    // CompletedSequenceNumber
    // CommittedSequenceNumber
    // LastAcknowledgementProcessedTimeUtc
  }

  inProgress(details: IRemoteReplicatorAcknowledgementDetail): boolean {
    return (+details.NotReceivedCount + +details.ReceivedAndNotAppliedCount) > 0;
  }

  replicationStatus(status: IRemoteReplicatorAcknowledgementStatus) {
    if(this.inProgress(status.CopyStreamAcknowledgementDetail)) {
      return 'Not Started';
    }
    
    if(this.inProgress(status.ReplicationStreamAcknowledgementDetail)) {
      return '4.2 minutes.';
    }
    return 'Complete';

  }

  currentStatus(status: IRemoteReplicatorAcknowledgementStatus) {
    if(this.inProgress(status.CopyStreamAcknowledgementDetail)) {
      return 'Copying';
    }

    if(this.inProgress(status.ReplicationStreamAcknowledgementDetail)) {
      return 'Replicating';
    }

    return 'Complete';

  }

}
