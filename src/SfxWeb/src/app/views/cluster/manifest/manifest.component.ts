import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { ClusterManifest } from 'src/app/Models/DataModels/Cluster';
import { Observable } from 'rxjs';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';

@Component({
    selector: 'app-manifest',
    templateUrl: './manifest.component.html',
    styleUrls: ['./manifest.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ManifestComponent extends BaseControllerDirective {
  private data = inject(DataService);


  clusterManifest: ClusterManifest;

  setup() {
    this.clusterManifest = this.data.clusterManifest;
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return this.clusterManifest.refresh(messageHandler);
  }
}
