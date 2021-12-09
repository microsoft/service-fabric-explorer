import { Component, OnInit, Injector } from '@angular/core';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable, forkJoin } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
import { ServiceBaseControllerDirective } from '../ServiceBase';
import { Constants } from 'src/app/Common/Constants';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent extends ServiceBaseControllerDirective {

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    if (this.data.clusterManifest.isBackupRestoreEnabled && this.service.isStatefulService
      && this.appTypeName !== Constants.SystemAppTypeName) {
      this.service.serviceBackupConfigurationInfoCollection.refresh(messageHandler);
      this.data.refreshBackupPolicies(messageHandler);
    }

    return forkJoin([
      this.service.description.refresh(messageHandler),
      this.service.partitions.refresh(messageHandler),
    ]);
  }
}
