import { Component, Injector, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { NodeCollection } from 'src/app/Models/DataModels/collections/NodeCollection';
import { DataService } from 'src/app/services/data.service';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent extends BaseControllerDirective {

  nodes: NodeCollection;
  filter = '';
  healthFilter: Record<string, boolean> = {};
  matrix: Record<string, Node[]> = {};

  constructor(private data: DataService, injector: Injector) {

    super(injector);
   }

   setup() {
    this.nodes = this.data.nodes;
   }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    this.nodes = this.data.nodes;

    return this.nodes.refresh(messageHandler).pipe(map(() => {
      const matrix = {};

      console.log(this.nodes)

      this.nodes.faultDomains.forEach(fd => {
        matrix[fd] = [];

        this.nodes.upgradeDomains.forEach(ud => {
          matrix[`${fd}${ud}`] = [];
          matrix[ud] = [];
        })
      })

      this.nodes.collection.forEach(node => {
        matrix[node.faultDomain + node.upgradeDomain].push(node);
        matrix[node.faultDomain].push(node);
        matrix[node.upgradeDomain].push(node);
      })

      this.matrix = matrix;

      console.log(matrix)
    }))
  }

  // public getNodesForDomains(upgradeDomain: string, faultDomain: string): Node[] {
  //   return this.nodes.collection.filter((node) => node.upgradeDomain === upgradeDomain &&
  //                                                 node.faultDomain === faultDomain &&
  //                                                 (this.filter.length > 0 ? node.name.toLowerCase().includes(this.filter) : true) &&
  //                                                 (node.healthState.badgeId in this.healthFilter ? this.healthFilter[node.healthState.badgeId] : true));
  // }
}
