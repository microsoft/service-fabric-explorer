import { KeyValue } from '@angular/common';
import { Component, Injector, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { NodeEventList } from 'src/app/Models/DataModels/collections/Collections';
import { NodeEvent } from 'src/app/Models/eventstore/Events';
import { IEventStoreData } from 'src/app/modules/event-store/event-store/event-store.component';
import { DataService } from 'src/app/services/data.service';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';

export interface NodeData {
  name?: string;
  status?: string;
  isSeed?: boolean;
  neighborHood?: string[];
  id?: string;
  instanceId?: string;
  inCluster?: boolean;
}

@Component({
  selector: 'app-federation',
  templateUrl: './federation.component.html',
  styleUrls: ['./federation.component.scss']
})
export class FederationComponent extends BaseControllerDirective {

  eventStoreHandler: IEventStoreData<NodeEventList, NodeEvent>;
  failedToLoadEvents: boolean;
  nodesMap = new Map<string, NodeData>();

  constructor(protected data: DataService, injector: Injector) {
    super(injector);
  }

  setup() {
    this.data.getClusterManifest().subscribe(manifest => {
      if (manifest.isEventStoreEnabled) {
        this.eventStoreHandler = this.data.getNodeEventData();
        this.eventStoreHandler.eventsList.setEventFilter([]);
        this.eventStoreHandler.eventsList.refresh().subscribe(success => {
          if (!success) this.failedToLoadEvents = true;
          else {
            this.nodesMap.clear();
            for (let elem of this.eventStoreHandler.eventsList.collection) {
              let node: NodeData;
              let currName = elem.raw.nodeName;
              switch (elem.raw.kind) {

                case "NodeOpenSucceeded":
                  if (!this.nodesMap.has(currName)) {
                    node = {
                      name: currName,
                      status: "Down",
                      isSeed: elem.raw.eventProperties.IsSeedNode,
                      id: elem.raw.eventProperties.NodeId,
                      instanceId: elem.raw.eventProperties.NodeInstance,
                      inCluster: false
                    }
                    this.nodesMap.set(elem.raw.nodeName, node);
                  }
                  break;

                case "NodeClosed":
                  this.nodesMap.delete(currName);
                  break;

                case "NodeAddedToCluster":
                  node = this.nodesMap.get(elem.raw.nodeName)
                  node.inCluster = true;
                  break;

                case "NodeRemovedFromCluster":
                  node = this.nodesMap.get(elem.raw.nodeName)
                  node.inCluster = false;
                  break;

                case "NodeUp":
                  node = this.nodesMap.get(elem.raw.nodeName)
                  node.status = "Up";
                  break;

                case "NodeDown":
                  node = this.nodesMap.get(elem.raw.nodeName)
                  node.status = "Down";
                  break;

              }
            }
          }
        });
      }
    });
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    this.setup();
    return of(null);
  }

  f(akv: KeyValue<string, NodeData>, bkv: KeyValue<string, NodeData>): number { 
    const a = akv.value.id;
    const b = bkv.value.id;
    const rez = a.localeCompare(b);
    return rez < 0 ? -1 : rez > 0 ? 1 : 0;
  }

  /*
  getParams(route: ActivatedRouteSnapshot): void {
    this.nodeName = IdUtils.getNodeName(route);
  }
  
  ngOnInit(): void {

  }
  
  fullRefresh(): Observable<any> {
    return this.common().pipe(mergeMap(() => this.refresh(this.messageService)));
  }
  */

}
