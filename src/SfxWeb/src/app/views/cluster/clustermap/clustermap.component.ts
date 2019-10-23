import { Component, OnInit } from '@angular/core';
import { NodeCollection } from 'src/app/Models/DataModels/Collections';
import { DataService } from 'src/app/services/data.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { tap } from 'rxjs/operators';
import { forkJoin, Observable } from 'rxjs';
import { Node } from 'src/app/Models/DataModels/Node';

@Component({
  selector: 'app-clustermap',
  templateUrl: './clustermap.component.html',
  styleUrls: ['./clustermap.component.scss']
})
export class ClustermapComponent implements OnInit {

  nodes: NodeCollection;
  
  constructor(private data: DataService) { }

  ngOnInit() {
    this.nodes = this.data.nodes;
    this.refresh().subscribe();
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return forkJoin([
      this.nodes.refresh(messageHandler),
    ]).pipe(tap())
  }

  public getNodesForDomains(upgradeDomain: string, faultDomain: string): Node[] {
    return this.nodes.collection.filter((node) => node.upgradeDomain === upgradeDomain && node.faultDomain === faultDomain);
}
}
