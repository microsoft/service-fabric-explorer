import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { DeployedAppBaseControllerDirective } from '../DeployedApplicationBase';
import { ExperienceService } from 'src/app/services/experience.service';

@Component({
    selector: 'app-details',
    templateUrl: './details.component.html',
    styleUrls: ['./details.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class DetailsComponent extends DeployedAppBaseControllerDirective {
  public experience = inject(ExperienceService);
  protected data: DataService = inject(DataService);
}
