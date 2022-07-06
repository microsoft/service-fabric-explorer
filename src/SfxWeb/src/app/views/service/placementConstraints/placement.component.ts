import { Component, OnInit, Injector, Input, NgModule } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable, forkJoin } from 'rxjs';
import { ServiceBaseControllerDirective } from '../ServiceBase';
import { map } from 'rxjs/operators';
import { INodeTypeInfo } from 'src/app/Models/DataModels/Cluster';
import { NodeCollection } from 'src/app/Models/DataModels/collections/NodeCollection';


interface IConstraint {
  name: string;
  result: boolean,
  index: number;
  fails: string[];
}

@Component({
  selector: 'app-placement',
  templateUrl: './placement.component.html',
  styleUrls: ['./placement.component.scss']
})
export class PlacementComponent extends ServiceBaseControllerDirective {
  public nodes: NodeCollection;
  public nodeTypeInfo: INodeTypeInfo[];
  public blockList: any[] = [];

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  setup() {
    this.nodes = this.data.nodes;
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
      return forkJoin([
        this.service.serviceBlockList.refresh(messageHandler).pipe(map(() => {
          // this.blockList = //TODO set correctly
        })),
        this.nodes.refresh(),
        this.data.clusterManifest.refresh().pipe(map(() => {
          this.nodeTypeInfo = this.data.clusterManifest.nodeTypeProperties;
        }))
      ]);
    }
  }
