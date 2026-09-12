import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ApplicationsBaseControllerDirective } from '../applicationsBase';
import { DataService } from 'src/app/services/data.service';
import { ExperienceService } from 'src/app/services/experience.service';

@Component({
    selector: 'app-apptypes',
    templateUrl: './apptypes.component.html',
    styleUrls: ['./apptypes.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ApptypesComponent  extends ApplicationsBaseControllerDirective {
  public experience = inject(ExperienceService);
  private dataService: DataService = inject(DataService);
}
