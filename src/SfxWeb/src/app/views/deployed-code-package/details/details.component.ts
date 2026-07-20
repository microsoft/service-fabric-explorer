import { Component, inject } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { DeployedCodePackageBaseControllerDirective } from '../DeployedCodePackageBase';

@Component({
    selector: 'app-details',
    templateUrl: './details.component.html',
    styleUrls: ['./details.component.scss'],
    standalone: false
})
export class DetailsComponent extends DeployedCodePackageBaseControllerDirective {
  protected data: DataService = inject(DataService);
}
