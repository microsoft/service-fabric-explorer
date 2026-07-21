import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { ServiceBaseControllerDirective } from '../ServiceBase';
import { DataService } from 'src/app/services/data.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';

@Component({
    selector: 'app-service-manifest',
    templateUrl: './manifest.component.html',
    styleUrls: ['./manifest.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ManifestComponent extends ServiceBaseControllerDirective {
  protected data: DataService = inject(DataService);

  serviceManifest: string;

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
