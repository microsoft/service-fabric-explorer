import { Component, Injector } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { DeployedAppBaseControllerDirective } from '../DeployedApplicationBase';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent extends DeployedAppBaseControllerDirective {

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
   }
}
