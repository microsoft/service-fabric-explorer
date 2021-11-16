import { Component, Injector, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HealthStateConstants } from 'src/app/Common/Constants';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { NodeCollection } from 'src/app/Models/DataModels/collections/NodeCollection';
import { Node } from 'src/app/Models/DataModels/Node';
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
  nodeTypeFilter: Record<string, boolean> = {};
  matrix: Record<string, Node[]>;
  groupByNodeType = false;

  constructor(private data: DataService, injector: Injector) {

    super(injector);
  }

  setup() {
    this.nodes = this.data.nodes;
    this.nodes = this.data.nodes;
    this.healthFilter[HealthStateConstants.OK] = true;
    this.healthFilter[HealthStateConstants.Warning] = true;
    this.healthFilter[HealthStateConstants.Error] = true;
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    this.nodes = this.data.nodes;

    return this.nodes.refresh(messageHandler).pipe(map(() => {
      this.nodes.nodeTypes.forEach(type => {
        if (!(type in this.nodeTypeFilter)) {
          this.nodeTypeFilter[type] = true;
        }
      });
      this.updateNodes();
    }));
  }

  public updateNodes() {
    const matrix = {};

    this.nodes.faultDomains.forEach(fd => {
      matrix[fd] = [];

      this.nodes.upgradeDomains.forEach(ud => {
        matrix[`${fd}${ud}`] = [];
        matrix[ud] = [];
      });
    });

    this.getNodesForDomains().forEach(node => {
      matrix[node.faultDomain + node.upgradeDomain].push(node);
      matrix[node.faultDomain].push(node);
      matrix[node.upgradeDomain].push(node);
    });

    this.matrix = matrix;
  }

  public getNodesForDomains(): Node[] {
    return this.nodes.collection.filter((node) => (node.raw.Type in this.nodeTypeFilter ? this.nodeTypeFilter[node.raw.Type] : true) &&
      (this.filter.length > 0 ? node.name.toLowerCase().includes(this.filter) : true) &&
      (node.healthState.badgeId in this.healthFilter ? this.healthFilter[node.healthState.badgeId] : true));
  }
}
