import { KeyValue } from '@angular/common';
import { Component, Injector } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
// import internal from 'assert';
// import { notDeepEqual } from 'assert';
import { NodeEventList } from 'src/app/Models/DataModels/collections/Collections';
import { NodeEvent } from 'src/app/Models/eventstore/Events';
import { IEventStoreData } from 'src/app/modules/event-store/event-store/event-store.component';
import { DataService } from 'src/app/services/data.service';
import { IdUtils } from 'src/app/Utils/IdUtils';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';

export interface NodeData {
  name?: string;
  status?: string;
  isSeed?: boolean;
  neighborHood?: string[];
  id?: string;
  instanceId?: string;
}

@Component({
  selector: 'app-newtab',
  templateUrl: './newtab.component.html',
  styleUrls: ['./newtab.component.scss']
})
export class NewtabComponent extends BaseControllerDirective {

  nodeName: string;
  eventStoreHandler: IEventStoreData<NodeEventList, NodeEvent>;
  failedToLoadEvents: boolean;
  nodesMap = new Map<string, NodeData>();

  constructor(protected data: DataService, injector: Injector) {
      super(injector);
   }

  setup() {
      this.data.getClusterManifest().subscribe(manifest => {
        if (manifest.isEventStoreEnabled) {
          //this.eventStoreHandler = this.data.getNodeEventData('_Node_0'); //this.nodeName
          this.eventStoreHandler = this.data.getNodeEventData();
          //this.eventStoreHandler.eventsList.setEventFilter(['NodeOpenSucceeded']);
          this.eventStoreHandler.eventsList.refresh().subscribe(success => {
            if (!success) this.failedToLoadEvents = true;
            else {
              for (let elem of this.eventStoreHandler.eventsList.collection) {
                let node: NodeData;
                switch (elem.raw.kind) {
                  case "NodeOpenSucceeded":
                    node = {
                      name: elem.raw.nodeName,
                      status: "Down",
                      isSeed: elem.raw.eventProperties.IsSeedNode,
                      id: elem.raw.eventProperties.NodeId,
                      instanceId: elem.raw.eventProperties.NodeInstance
                    }
                    this.nodesMap.set(elem.raw.nodeName, node);
                    break;
                  case "NodeUp":
                    node = this.nodesMap.get(elem.raw.nodeName)
                    node.status = "Up";
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

  f(akv: KeyValue<string, NodeData>, bkv: KeyValue<string, NodeData>): number { 
    const a = akv.value.id;
    const b = bkv.value.id;
    const rez = a.localeCompare(b);
    return rez < 0 ? -1 : rez > 0 ? 1 : 0;
  }

}
