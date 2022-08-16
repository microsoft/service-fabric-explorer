import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { InfrastructureJob } from 'src/app/Models/DataModels/infrastructureJob';
import { Constants } from 'src/app/Common/Constants';
import { RepairTask } from 'src/app/Models/DataModels/repairTask';
import { ListSettings, ListColumnSetting, ListColumnSettingWithFilter, ListColumnSettingWithShorten } from 'src/app/Models/ListSettings';
import { SettingsService } from 'src/app/services/settings.service';
import { RepairTaskCollection } from 'src/app/Models/DataModels/collections/RepairTaskCollection';
import { DataService } from 'src/app/services/data.service';
import { InfrastructureCollectionItem } from 'src/app/Models/DataModels/collections/infrastructureCollection';

@Component({
  selector: 'app-infrastructure-overview',
  templateUrl: './infrastructure-overview.component.html',
  styleUrls: ['./infrastructure-overview.component.scss']
})
export class InfrastructureOverviewComponent implements OnInit, OnChanges {
  @Input() collection: InfrastructureCollectionItem;
  @Input() jobs: InfrastructureJob[];
  @Input() repairCollection: RepairTaskCollection;

  allPendingMRJobsList: ListSettings;
  completedMRJobsList: ListSettings;

  infrastructureJobsSuggestion: string[] = [];
  constructor(private settings: SettingsService, private data: DataService) { }

  ngOnInit(): void {
    this.allPendingMRJobsList = this.settings.getNewOrExistingInfrastructureSettings();

    this.completedMRJobsList = this.settings.getNewOrExistingListSettings('completedMRJobs', [], [
      new ListColumnSetting('raw.Id', 'Job Id'),
      new ListColumnSetting('raw.ImpactAction', 'Impact Action'),
      new ListColumnSetting('raw.RoleInstancesToBeImpacted', 'Impacted Nodes'),
    ]);
    this.infrastructureJobsSuggestion = [];
  }

  ngOnChanges(): void {
    this.infrastructureJobsSuggestion = [];
  }
}
