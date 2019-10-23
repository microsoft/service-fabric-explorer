import { Component, OnInit } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { ClusterManifest } from 'src/app/Models/DataModels/Cluster';
import { Observable } from 'rxjs';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';

@Component({
  selector: 'app-manifest',
  templateUrl: './manifest.component.html',
  styleUrls: ['./manifest.component.scss']
})
export class ManifestComponent implements OnInit {

  clusterManifest: ClusterManifest;

  constructor(private data: DataService) { }

  ngOnInit() {
    this.clusterManifest = this.data.clusterManifest;
    this.refresh().subscribe();
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return this.clusterManifest.refresh(messageHandler);
  }
}
