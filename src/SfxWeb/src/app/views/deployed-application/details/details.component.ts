import { Component, inject } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { DeployedAppBaseControllerDirective } from '../DeployedApplicationBase';

@Component({
    selector: 'app-details',
    templateUrl: './details.component.html',
    styleUrls: ['./details.component.scss'],
    standalone: false
})
export class DetailsComponent extends DeployedAppBaseControllerDirective {
  protected data: DataService = inject(DataService);
}
