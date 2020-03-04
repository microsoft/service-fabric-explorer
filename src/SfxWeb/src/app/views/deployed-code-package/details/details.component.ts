import { Component, OnInit, Injector } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { DeployedCodePackageBaseController } from '../DeployedCodePackageBase';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent extends DeployedCodePackageBaseController {

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }
}
