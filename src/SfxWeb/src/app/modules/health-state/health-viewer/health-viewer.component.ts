import { Component, Input, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { HealthEvaluation } from 'src/app/Models/DataModels/Shared';
import { ListColumnSetting, ListSettings } from 'src/app/Models/ListSettings';
import { IRawUnhealthyEvaluation } from 'src/app/Models/RawDataTypes';
import { SettingsService } from 'src/app/services/settings.service';
import { ExperienceService } from 'src/app/services/experience.service';
import { HealthDescriptionComponent } from './health-description.component';

@Component({
    selector: 'app-health-viewer',
    templateUrl: './health-viewer.component.html',
    styleUrls: ['./health-viewer.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class HealthViewerComponent implements OnInit {
  public experience = inject(ExperienceService);
  private settings = inject(SettingsService);


  @Input() unhealthyEvaluations!: IRawUnhealthyEvaluation[];
  @Input() healthyEvaluations!: HealthEvaluation[];

  unhealthyEvaluationsListSettings!: ListSettings;
  healthEventsListSettings!: ListSettings;
  modernHealthEventsListSettings!: ListSettings;

  ngOnInit(): void {
    this.unhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings();
    this.healthEventsListSettings = this.settings.getNewOrExistingHealthEventsListSettings();
    const description = new ListColumnSetting('raw.Description', 'Description', { enableFilter: false });
    description.template = HealthDescriptionComponent;
    const columns = [...this.healthEventsListSettings.columnSettings];
    columns.splice(3, 0, description);
    this.modernHealthEventsListSettings = this.settings.getNewOrExistingListSettings('modern health Events', ['raw.SequenceNumber'], columns);
  }

}
