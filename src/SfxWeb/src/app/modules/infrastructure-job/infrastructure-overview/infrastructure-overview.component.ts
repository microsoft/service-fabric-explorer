import { Component, Input, OnChanges, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { InfrastructureJob } from 'src/app/Models/DataModels/infrastructureJob';
import { ListSettings, ListColumnSetting, ListColumnSettingWithFilter, ListColumnSettingWithShorten } from 'src/app/Models/ListSettings';
import { SettingsService } from 'src/app/services/settings.service';
import { RepairTaskCollection } from 'src/app/Models/DataModels/collections/RepairTaskCollection';
import { InfrastructureCollectionItem } from 'src/app/Models/DataModels/collections/infrastructureCollection';

@Component({
    selector: 'app-infrastructure-overview',
    templateUrl: './infrastructure-overview.component.html',
    styleUrls: ['./infrastructure-overview.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class InfrastructureOverviewComponent implements OnInit {
  private settings = inject(SettingsService);

  @Input() collection: InfrastructureCollectionItem;
  @Input() jobs: InfrastructureJob[];
  @Input() repairCollection: RepairTaskCollection;

  allPendingMRJobsList: ListSettings;
  completedMRJobsList: ListSettings;

  ngOnInit(): void {
    this.allPendingMRJobsList = this.settings.getNewOrExistingInfrastructureSettings();

    this.completedMRJobsList = this.settings.getNewOrExistingListSettings('completedMRJobs', [], [
      new ListColumnSetting('raw.Id', 'Job Id'),
      new ListColumnSetting('raw.ImpactAction', 'Impact Action'),
      new ListColumnSetting('raw.RoleInstancesToBeImpacted', 'Impacted Nodes'),
    ]);
  }

  trackByFn(index: number, job: InfrastructureJob) {
    return job.id;
  }
}
