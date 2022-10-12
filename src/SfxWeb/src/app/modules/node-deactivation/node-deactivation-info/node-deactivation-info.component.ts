import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { Node } from 'src/app/Models/DataModels/Node';
import { ListColumnSetting, ListSettings } from 'src/app/Models/ListSettings';
import { IRawNodeDeactivationInfo } from 'src/app/Models/RawDataTypes';
import { SettingsService } from 'src/app/services/settings.service';
import { IProgressStatus } from 'src/app/shared/component/phase-diagram/phase-diagram.component';
import { DeactivationUtils } from 'src/app/Utils/deactivationUtils';

@Component({
  selector: 'app-node-deactivation-info',
  templateUrl: './node-deactivation-info.component.html',
  styleUrls: ['./node-deactivation-info.component.scss']
})
export class NodeDeactivationInfoComponent implements OnInit, OnChanges {

  public readonly seedNodeQuorumMessage = "This node deactivation is waiting on a Seed Node Quorom safety check. If this deactivation is going for an irregular amount of time, consider referring to the following TSG to potentially continue progress for this deactivation."

  @Input() node: Node;
  @Input() deactivationInfo: IRawNodeDeactivationInfo;

  public progress: IProgressStatus[] = [];
  public index = -1;

  showSeedNodeTSG = false;

  settings: ListSettings;

  constructor(public settingsService: SettingsService) { }

  ngOnInit(): void {
    this.settings = this.settingsService.getNewOrExistingListSettings('tasks', null,
    [
      new ListColumnSetting('NodeDeactivationIntent', 'Intent'),
      new ListColumnSetting('NodeDeactivationTaskId.Id', 'Id'),
      new ListColumnSetting('NodeDeactivationTaskId.NodeDeactivationTaskType', 'Task Type'),
    ]);
  }

  ngOnChanges(): void {

   this.showSeedNodeTSG =  DeactivationUtils.hasSeedNodeSafetyCheck(this.deactivationInfo);

   const phaseMap = {
      SafetyCheckInProgress: 1,
      SafetyCheckComplete: 2,
      Completed: 3
    };

   this.index = phaseMap[this.deactivationInfo.NodeDeactivationStatus] + 1;

   this.progress = [
      {
        name: 'Safety Check InProgress',
      },
      {
        name: 'Safety Check Complete',
      },
      {
        name: 'Completed',
      }
    ];
  }
}

