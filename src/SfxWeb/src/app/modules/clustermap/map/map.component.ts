import { Component, Injector, Input, OnInit, TemplateRef } from '@angular/core';
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

  @Input() listTemplate: TemplateRef<any>;

  groupByNodeType = false;
  nodes: NodeCollection;
  matrix: Record<string, Node[]>;

  constructor(private data: DataService, injector: Injector) {

    super(injector);
  }

  setup() {
    this.nodes = this.data.nodes;
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    this.nodes = this.data.nodes;

    return this.nodes.refresh(messageHandler);
  }

  public updateNodes(nodes: Node[]) {

    const matrix = {};

    this.nodes.faultDomains.forEach(fd => {
      matrix[fd] = [];

      this.nodes.upgradeDomains.forEach(ud => {
        matrix[`${fd}${ud}`] = [];
        matrix[ud] = [];
      });
    });

    nodes.forEach(node => {
      matrix[node.faultDomain + node.upgradeDomain].push(node);
      matrix[node.faultDomain].push(node);
      matrix[node.upgradeDomain].push(node);
    });

    this.matrix = matrix;
  }

  trackByFn(index, udOrFd: string) {
    return udOrFd;
  }
}
