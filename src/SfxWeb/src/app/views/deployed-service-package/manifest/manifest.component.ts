import { Component, Injector } from '@angular/core';
import { DeployedServicePackageBaseControllerDirective } from '../DeployedServicePackage';
import { DataService } from 'src/app/services/data.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ServiceManifest } from 'src/app/Models/DataModels/Service';

@Component({
  selector: 'app-manifest',
  templateUrl: './manifest.component.html',
  styleUrls: ['./manifest.component.scss']
})
export class ManifestComponent extends DeployedServicePackageBaseControllerDirective {
  serviceManifest: ServiceManifest;

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  setup() {}

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    return this.servicePackage.manifest.refresh(messageHandler).pipe(map(manifest => {
      this.serviceManifest = manifest;
    }));
  }
}
