import { Component, OnInit, Injector } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { ClusterManifest } from 'src/app/Models/DataModels/Cluster';
import { Observable } from 'rxjs';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { BaseController } from 'src/app/ViewModels/BaseController';

@Component({
  selector: 'app-manifest',
  templateUrl: './manifest.component.html',
  styleUrls: ['./manifest.component.scss']
})
export class ManifestComponent extends BaseController {

  clusterManifest: ClusterManifest;

  constructor(private data: DataService, injector: Injector) {
    super(injector);
   }

  setup() {
    this.clusterManifest = this.data.clusterManifest;
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return this.clusterManifest.refresh(messageHandler);
  }
}
