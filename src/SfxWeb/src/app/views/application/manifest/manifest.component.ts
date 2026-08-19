import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { ApplicationBaseControllerDirective } from '../applicationBase';
import { DataService } from 'src/app/services/data.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-app-manifest',
    templateUrl: './manifest.component.html',
    styleUrls: ['./manifest.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ManifestComponent extends ApplicationBaseControllerDirective {
  protected data: DataService = inject(DataService);

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    return this.app.manifest.refresh(messageHandler);
  }

}
