import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { DeployedServicePackageBaseControllerDirective } from '../DeployedServicePackage';
import { ExperienceService } from 'src/app/services/experience.service';
import { DataService } from 'src/app/services/data.service';

@Component({
    selector: 'app-details',
    templateUrl: './details.component.html',
    styleUrls: ['./details.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class DetailsComponent extends DeployedServicePackageBaseControllerDirective {
  public experience = inject(ExperienceService);
  protected data: DataService = inject(DataService);
}
