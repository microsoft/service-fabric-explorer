import { KeyValue } from '@angular/common';
import { Component, Injector, OnInit } from '@angular/core';
import Highcharts from 'highcharts';
import { Observable, of } from 'rxjs';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { NodeEventList } from 'src/app/Models/DataModels/collections/Collections';
import { NodeEvent } from 'src/app/Models/eventstore/Events';
import { IEventStoreData } from 'src/app/modules/event-store/event-store/event-store.component';
import { NodeDeactivationInfoComponent } from 'src/app/modules/node-deactivation/node-deactivation-info/node-deactivation-info.component';
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
  Highcharts: typeof Highcharts = Highcharts;
  neighSize: number = 2;

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

            let mapArray = [...this.nodesMap].sort((a, b) => a[1].id.localeCompare(b[1].id));
            //let mapArray = [...this.nodesMap];
            let len = mapArray.length;
            let ddata = [];
            for (let i = 0; i < len-1; ++i) {
                ddata.push([mapArray[i][0], mapArray[i+1][0]]);
            }
            ddata.push([mapArray[len-1][0], mapArray[0][0]]);
            
            let nodeHover = [];
            for (let node of mapArray) {
              let struct = {
                'id': node[1].name,
                title: 
                  "Status: " + node[1].status + 
                  "<br/>IsSeed: " + node[1].isSeed +
                  "<br/>NodeId: " + node[1].id +
                  "<br/>NodeInstance: " + node[1].instanceId,
                color: node[1].inCluster ? '#c0f77b' : '#5db7fa'
              };
              nodeHover.push(struct);
            }

            let nSize = this.neighSize;
            Highcharts.chart('container', {
              chart: {
                renderTo: 'container',
                type: 'networkgraph',
                height: '100%'
              },
              title: {
                text: 'Federation'
              },
              plotOptions: {
                networkgraph: {
                  keys: ['from', 'to'],
                  layoutAlgorithm: {
                    enableSimulation: false
                    //friction: -0.9
                  }
                }
              },
              tooltip: {
                formatter: function() {
  
                  let ind = this.point.index;
                  for (let i = 1; i < nSize; ++i) {
                      let ind1 = (ind+i)%len;
                      let ind2 = ind-i-1;
                      if (ind2 < 0) ind2 += len;
                      this.series.data[ind1].setState('hover');
                      this.series.data[ind2].setState('hover');
                  }

                  const {
                    title
                  } = this.point.options;
                  return title;
                }
              },
              series: [{
                type: 'networkgraph',
                allowPointSelect: true,
                marker: {
                  radius: 50
                },
                accessibility: {
                  enabled: false
                },
                dataLabels: {
                  enabled: true,
                  linkFormat: '',
                  style: {
                    fontSize: '20',
                  },
                  y: 25
                },
                id: 'federation',
                nodes: nodeHover,
                data: ddata
              }]
            });
            
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
