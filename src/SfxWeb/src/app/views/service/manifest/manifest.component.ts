import { Component, OnInit, Injector } from '@angular/core';
import { ServiceBaseControllerDirective } from '../ServiceBase';
import { DataService } from 'src/app/services/data.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-service-manifest',
  templateUrl: './manifest.component.html',
  styleUrls: ['./manifest.component.scss']
})
export class ManifestComponent extends ServiceBaseControllerDirective {
  serviceManifest: string;

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  setup() {}

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    const app = this.service.parent;
    return this.data.getServiceType(app.raw.TypeName, app.raw.TypeVersion, this.service.description.raw.ServiceTypeName, true, messageHandler)
        .pipe(mergeMap(serviceType => {
            return serviceType.manifest.refresh(messageHandler).pipe(map(() => {
              this.serviceManifest = serviceType.manifest.raw.Manifest;
            }));
        }));
  }
}
