import { Component, Injector, OnInit } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { forkJoin, Observable } from 'rxjs';
import { Node } from 'src/app/Models/DataModels/Node';
import { BaseController } from 'src/app/ViewModels/BaseController';
import { NodeCollection } from 'src/app/Models/DataModels/collections/NodeCollection';
import { HealthStateConstants } from 'src/app/Common/Constants';

@Component({
  selector: 'app-clustermap',
  templateUrl: './clustermap.component.html',
  styleUrls: ['./clustermap.component.scss']
})
export class ClustermapComponent extends BaseController {

  nodes: NodeCollection;
  filter = '';
  healthFilter: Record<string, boolean> = {};

  constructor(private data: DataService, injector: Injector) {

    super(injector);
   }

   setup(){
    this.nodes = this.data.nodes;
    this.healthFilter[HealthStateConstants.OK] = true;
    this.healthFilter[HealthStateConstants.Warning] = true;
    this.healthFilter[HealthStateConstants.Error] = true;
   }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return forkJoin([
      this.nodes.refresh(messageHandler)
    ]);
  }

  public getNodesForDomains(upgradeDomain: string, faultDomain: string): Node[] {
    return this.nodes.collection.filter((node) => node.upgradeDomain === upgradeDomain &&
                                                  node.faultDomain === faultDomain &&
                                                  (this.filter.length > 0 ? node.name.toLowerCase().includes(this.filter) : true) &&
                                                  (node.healthState.badgeId in this.healthFilter ? this.healthFilter[node.healthState.badgeId] : true));
  }
}
