import { Component, Input, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { HealthEvaluation } from 'src/app/Models/DataModels/Shared';
import { ListSettings } from 'src/app/Models/ListSettings';
import { IRawUnhealthyEvaluation } from 'src/app/Models/RawDataTypes';
import { SettingsService } from 'src/app/services/settings.service';

@Component({
    selector: 'app-health-viewer',
    templateUrl: './health-viewer.component.html',
    styleUrls: ['./health-viewer.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class HealthViewerComponent implements OnInit {
  private settings = inject(SettingsService);


  @Input() unhealthyEvaluations: IRawUnhealthyEvaluation[];
  @Input() healthyEvaluations: HealthEvaluation[];

  unhealthyEvaluationsListSettings: ListSettings;
  healthEventsListSettings: ListSettings;

  ngOnInit(): void {
    this.unhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings();
    this.healthEventsListSettings = this.settings.getNewOrExistingHealthEventsListSettings();
  }

}
