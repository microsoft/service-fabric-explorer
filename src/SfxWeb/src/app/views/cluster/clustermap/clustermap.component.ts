import { Component, inject } from '@angular/core';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { NodeCollection } from 'src/app/Models/DataModels/collections/NodeCollection';
import { DataService } from 'src/app/services/data.service';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';

@Component({
    selector: 'app-clustermap',
    templateUrl: './clustermap.component.html',
    styleUrls: ['./clustermap.component.scss'],
    standalone: false
})
export class ClustermapComponent extends BaseControllerDirective {
  private dataService = inject(DataService);

  nodes: NodeCollection;
  filteredNodes = [];

  groupByNodeType = false;

   setup() {
     this.nodes = this.dataService.nodes;
   }

   refresh(messageHandler: IResponseMessageHandler) {
    return this.nodes.refresh(messageHandler);
   }

   setNodes(nodes: Node[]) {
    this.filteredNodes = nodes;
   }
}
