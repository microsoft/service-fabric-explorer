import { Component, Injector } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { DeployedCodePackageBaseController } from '../DeployedCodePackageBase';

@Component({
  selector: 'app-essentials',
  templateUrl: './essentials.component.html',
  styleUrls: ['./essentials.component.scss']
})
export class EssentialsComponent extends DeployedCodePackageBaseController {

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }
}
