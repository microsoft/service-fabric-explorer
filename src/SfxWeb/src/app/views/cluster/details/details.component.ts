import { Component, OnInit } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { ClusterUpgradeProgress, ClusterLoadInformation } from 'src/app/Models/DataModels/Cluster';
import { tap } from 'rxjs/operators';
import { forkJoin, Observable } from 'rxjs';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';


@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent implements OnInit {

  clusterUpgradeProgress: ClusterUpgradeProgress;
  clusterLoadInformation: ClusterLoadInformation;
  constructor(private data: DataService) { }

  ngOnInit() {
    this.clusterUpgradeProgress = this.data.clusterUpgradeProgress;
    this.clusterLoadInformation = this.data.clusterLoadInformation;
    this.refresh().subscribe();
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return forkJoin([
      this.clusterUpgradeProgress.refresh(messageHandler),
      this.clusterLoadInformation.refresh(messageHandler)
    ]).pipe(tap())
  }
}
