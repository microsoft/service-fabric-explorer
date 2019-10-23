import { Component, OnInit } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { ClusterUpgradeProgress, ClusterHealth } from '../../../Models/DataModels/Cluster';
import { NodeCollection } from '../../../Models/DataModels/Collections';
import { HealthStateFilterFlags } from 'src/app/Models/HealthChunkRawDataTypes';
import { SystemApplication } from 'src/app/Models/DataModels/Application';
import { Observable, forkJoin } from 'rxjs';
import { RefreshService } from 'src/app/services/refresh.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { tap } from 'rxjs/operators';


@Component({
  selector: 'app-essentials',
  templateUrl: './essentials.component.html',
  styleUrls: ['./essentials.component.scss']
})
export class EssentialsComponent implements OnInit {

  clusterUpgradeProgress: ClusterUpgradeProgress;
  nodes: NodeCollection;
  clusterHealth: ClusterHealth;
  systemApp: SystemApplication;
  constructor(public data: DataService, private refreshService: RefreshService) { }

  ngOnInit() {
    this.clusterHealth = this.data.getClusterHealth(HealthStateFilterFlags.Default, HealthStateFilterFlags.None, HealthStateFilterFlags.None);
    this.clusterUpgradeProgress = this.data.clusterUpgradeProgress;
    this.nodes = this.data.nodes;
    this.systemApp = this.data.systemApp;
    // this.dataService.getClusterUpgradeProgress().subscribe( data => {
    //   console.log(data);
    // })
    // this.dataService.getClusterUpgradeProgress().subscribe( data => {
    //   console.log(data);
    // })
    // this.dataService.getClusterLoadInformation().subscribe( data => {
    //   console.log(data);
    // })

    // this.dataService.getApps().subscribe( data => {
    //   console.log(data)
    //   this.dataService.getServices(data.collection[0].id).subscribe( data2 => {
    //     console.log(data2);
    //   })
    // })

    // this.dataService.getNodes().subscribe( data => 
    //   console.log(data));

    // this.dataService.getAppTypeGroups().subscribe( data => {
    //   console.log(data);
    // })
    this.refresh().subscribe();
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    let observs = [];

    observs.push(this.clusterHealth.refresh(messageHandler))
    // For healthy seed nodes / fault domains and upgrade domains
    observs.push(this.nodes.refresh(messageHandler));

    // For system application health state
    observs.push(this.systemApp.refresh(messageHandler));

    observs.push(this.clusterUpgradeProgress.refresh(messageHandler));
    return forkJoin(observs).pipe(tap())
  }

}
