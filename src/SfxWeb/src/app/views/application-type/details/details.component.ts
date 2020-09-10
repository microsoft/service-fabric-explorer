import { Component, OnInit, Injector } from '@angular/core';
import { BaseController } from 'src/app/ViewModels/BaseController';
import { DataService } from 'src/app/services/data.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { ActivatedRouteSnapshot } from '@angular/router';
import { IdUtils } from 'src/app/Utils/IdUtils';
import { ApplicationTypeGroup } from 'src/app/Models/DataModels/ApplicationType';
import { mergeMap } from 'rxjs/operators';
import { forkJoin, Observable } from 'rxjs';
import { ApplicationTypeBaseController } from '../ApplicationTypeBase';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent extends ApplicationTypeBaseController {
  appTypeName: string;
  appTypeGroup: ApplicationTypeGroup;

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  setup() { }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return forkJoin(this.appTypeGroup.appTypes.map(appType => appType.serviceTypes.refresh(messageHandler).pipe(mergeMap(() => {
      return forkJoin(appType.serviceTypes.collection.map(serviceType => serviceType.manifest.refresh(messageHandler)));
    }))));
  }

}
