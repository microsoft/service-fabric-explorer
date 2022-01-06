import { Component, Injector } from '@angular/core';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';

@Component({
  selector: 'app-clustermap',
  templateUrl: './clustermap.component.html',
  styleUrls: ['./clustermap.component.scss']
})
export class ClustermapComponent extends BaseControllerDirective {

  constructor(injector: Injector) {
    super(injector);
   }

}
