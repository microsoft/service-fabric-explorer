import { KeyValue } from '@angular/common';
import { Component, Injector, OnDestroy, OnInit } from '@angular/core';
import Bluebird from 'cypress/types/bluebird';
import Highcharts from 'highcharts';
import { Observable, of, Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { NodeEventList, PartitionEventList } from 'src/app/Models/DataModels/collections/Collections';
import { NodeEvent, PartitionEvent } from 'src/app/Models/eventstore/Events';
import { NodeStatus } from 'src/app/Models/RawDataTypes';
import { IOnDateChange } from 'src/app/modules/event-store/double-slider/double-slider.component';
import { IEventStoreData, IQuickDates } from 'src/app/modules/event-store/event-store/event-store.component';
import { IOptionConfig, IOptionData } from 'src/app/modules/event-store/option-picker/option-picker.component';
import { DataService } from 'src/app/services/data.service';
import { TelemetryService } from 'src/app/services/telemetry.service';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';

export interface NodeData {
  name?: string;
  status?: string;
  isSeed?: boolean;
  id?: string;
  instanceId?: string;
  inCluster?: boolean;
  FM?: boolean;
  FMM?: boolean;
}

@Component({
  selector: 'app-federation',
  templateUrl: './federation.component.html',
  styleUrls: ['./federation.component.scss']
})
export class FederationComponent extends BaseControllerDirective implements OnInit, OnDestroy {

  // nodeEvents
  eventStoreHandler: IEventStoreData<NodeEventList, NodeEvent>;
  // partitionEvents, but only the FM related
  eventStoreHandlerFM: IEventStoreData<PartitionEventList, PartitionEvent>;
  failedToLoadEvents: boolean;
  nodesMap = new Map<string, NodeData>();
  Highcharts: typeof Highcharts = Highcharts;
  // should be initialized with neighborhood size setup in manifest
  // currently, it's only in testing purposes so it's hardcoded
  neighSize: number = 2;

  private debounceHandler: Subject<IOnDateChange> = new Subject<IOnDateChange>();
  private debouncerHandlerSubscription: Subscription;
  optionsConfig: IOptionConfig;
  public startDateMin: Date;
  public startDateMax: Date;
  public startDate: Date;
  public endDate: Date;

  public quickDates = [
    { display: 'Last 1 Hour', hours: 1 },
    { display: 'Last 3 Hours', hours: 3 },
    { display: 'Last 6 Hours', hours: 6 },
    { display: 'Last 1 Day', hours: 24 },
    { display: 'Last 7 Days', hours: 168 }
  ];

  constructor(protected data: DataService, injector: Injector, private telemService: TelemetryService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    this.optionsConfig = {
      enableNodes: true,
      enableRepairTasks: true
    };

    this.resetSelectionProperties();
    this.debouncerHandlerSubscription = this.debounceHandler
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(dates => {
        this.startDate = new Date(dates.startDate);
        this.endDate = new Date(dates.endDate);
      });
  }

  ngOnDestroy() {
    this.debouncerHandlerSubscription.unsubscribe();
  }

  setup() {
    this.data.getClusterManifest().subscribe(manifest => {
      if (manifest.isEventStoreEnabled) {
        // collecting required events and filtering based on timeline bar
        this.eventStoreHandler = this.data.getNodeEventData();
        this.eventStoreHandler.setDateWindow(this.startDate, this.endDate);
        this.eventStoreHandlerFM = this.data.getPartitionEventData();
        this.eventStoreHandlerFM.setDateWindow(this.startDate, this.endDate);

        // processing of node events
        this.eventStoreHandler.eventsList.refresh().subscribe(success => {
          if (!success) this.failedToLoadEvents = true;
          else {
            let FMMNodeName: string = "";
            this.nodesMap.clear();
            for (let elem of this.eventStoreHandler.eventsList.collection) {
              let node: NodeData;
              let currName = elem.raw.nodeName;
              // recognition of selected node events and logics implementation
              switch (elem.raw.kind) {
                case "NodeOpenSucceeded":
                  if (!this.nodesMap.has(currName)) {
                    node = {
                      name: currName,
                      status: "Down",
                      isSeed: elem.raw.eventProperties.IsSeedNode,
                      id: elem.raw.eventProperties.NodeId,
                      instanceId: elem.raw.eventProperties.NodeInstance,
                      inCluster: false,
                      FM: false,
                      FMM: false
                    }
                    this.nodesMap.set(elem.raw.nodeName, node);
                  }
                  else {
                    node = this.nodesMap.get(currName);
                    node.isSeed = elem.raw.eventProperties.IsSeedNode;
                    node.instanceId = elem.raw.eventProperties.NodeInstance
                    node.FM = false;
                    node.FMM = false;
                  }
                  break;
                case "NodeClosed":
                  // not sure what should happen here
                  this.nodesMap.delete(currName);
                  break;
                case "NodeAddedToCluster":
                  node = this.nodesMap.get(currName);
                  node.inCluster = true;
                  break;
                case "NodeRemovedFromCluster":
                  // not sure what should happen here
                  node = this.nodesMap.get(elem.raw.nodeName)
                  node.inCluster = false;
                  // this.nodesMap.delete(currName);
                  break;
                case "NodeUp":
                  node = this.nodesMap.get(currName);
                  node.status = "Up";
                  break;
                case "NodeDown":
                  node = this.nodesMap.get(currName);
                  node.status = "Down";
                  break;
                case "GrayNode":
                  node = this.nodesMap.get(currName);
                  node.status = "Gray";
                  break;
                case "FMMUp":
                  FMMNodeName = currName;
                  break;
              }
            }

            // set the FMM info
            if (FMMNodeName != "") {
              let node = this.nodesMap.get(FMMNodeName);
              node.FMM = true;
            }

            // processing of FM events
            this.eventStoreHandlerFM.eventsList.refresh().subscribe(success => {
              if (!success) this.failedToLoadEvents = true;
              else {
              let fmName = "";
              for (let i = this.eventStoreHandlerFM.eventsList.collection.length - 1; i >= 0; --i) {
                  let fmElem = this.eventStoreHandlerFM.eventsList.collection[i];
                  if (fmElem.raw.partitionId == '00000000-0000-0000-0000-000000000001' && fmElem.raw.kind == 'PartitionReconfigured') {
                    fmName = fmElem.raw.raw.NodeName;
                    break;
                }
             }
              if (fmName.localeCompare("") != 0)
                this.nodesMap.get(fmName).FM = true;
              
              // forming data for graph in ascending order of node ids
              let mapArray = [...this.nodesMap].sort((a, b) => a[1].id.localeCompare(b[1].id));
              let len = mapArray.length;
              let ddata = [];
              if (len > 0) {
                for (let i = 0; i < len-1; ++i)
                  ddata.push([mapArray[i][0], mapArray[i+1][0]]);
                if (len > 2)
                  ddata.push([mapArray[len-1][0], mapArray[0][0]]);
              }
            
              // forming data for node hover
              let nodeHover = [];
              for (let node of mapArray) {
                let struct = {
                'id': node[1].name,
                title: 
                  "Status: " + node[1].status + 
                  "<br/>IsSeed: " + node[1].isSeed +
                  "<br/>NodeId: " + node[1].id +
                  "<br/>NodeInstance: " + node[1].instanceId + 
                  "<br/>FM: " + node[1].FM +
                  "<br/>FMM: " + node[1].FMM,
                color: this.getNodeColor(node[1])
                };
                nodeHover.push(struct);
              }
            
              // forming graph
              this.fillHighchart(nodeHover, ddata, len);
              }
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

  fillHighchart(nodeHover: any[], ddata: any[], len: number): void {
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

  f(akv: KeyValue<string, NodeData>, bkv: KeyValue<string, NodeData>): number { 
    const a = akv.value.id;
    const b = bkv.value.id;
    const rez = a.localeCompare(b);
    return rez < 0 ? -1 : rez > 0 ? 1 : 0;
  }

  readonly blue: string = "#5db7fa";
  readonly green: string = "#c0f77b";
  readonly gray: string = "#999999";
  readonly red: string = "#f08f8f";

  getNodeColor(node: NodeData): string {
    if (node.inCluster) {
      if (node.status == "Up") return this.green;
      if (node.status == "Gray") return this.gray;
    }
    return this.red;
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

  private resetSelectionProperties(): void {
    const todaysDate = new Date();
    this.startDate = TimeUtils.AddDays(todaysDate, -7);
    this.endDate = this.startDateMax = todaysDate;
    this.startDateMin = TimeUtils.AddDays(todaysDate, -30);
  }

  public setDate(date: IQuickDates) {
    this.setNewDates({
      endDate: new Date(this.endDate),
      startDate: TimeUtils.AddHours(this.endDate, -1 * date.hours)
    });
  }

  setNewDates(dates: IOnDateChange) {
    this.debounceHandler.next(dates);
  }

}
