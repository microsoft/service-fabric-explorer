import { Component, OnInit, Input } from '@angular/core';
import { ReplicatorStatus } from 'src/app/Models/DataModels/DeployedReplica';
import { SettingsService } from 'src/app/services/settings.service';
import { ListSettings, ListColumnSetting } from 'src/app/Models/ListSettings';

@Component({
  selector: 'app-replicator-status',
  templateUrl: './replicator-status.component.html',
  styleUrls: ['./replicator-status.component.scss']
})
export class ReplicatorStatusComponent implements OnInit {

  @Input() replicatorData: ReplicatorStatus;

  public listSettings: ListSettings;

  constructor(private settings: SettingsService) { }

  ngOnInit(): void {
    this.replicatorData.remoteReplicators;

    this.listSettings = this.settings.getNewOrExistingListSettings("ReplicatorStatus", [], [
      new ListColumnSetting("ReplicaId", "Id"),
      // new ListColumnSetting("LastReceivedReplicationSequenceNumber", "LastReceivedReplicationSequenceNumber"),
      new ListColumnSetting("LastAppliedReplicationSequenceNumber", "LSN"),
      // new ListColumnSetting("CommittedSequenceNumber", "CommittedSequenceNumber"),
      new ListColumnSetting("RemoteReplicatorAcknowledgementStatus.CopyStreamAcknowledgementDetail.AverageApplyDuration", "AverageApplyDuration"),
      new ListColumnSetting("LastAcknowledgementProcessedTimeUtc", "LastAcknowledgementProcessedTimeUtc"),
      new ListColumnSetting("LastAcknowledgementProcessedTimeUtc", "LastAcknowledgementProcessedTimeUtc"),
    ]);

    //replica id
    // LastSequenceNumber
    // CompletedSequenceNumber
    // CommittedSequenceNumber
    // LastAcknowledgementProcessedTimeUtc
  }

}
