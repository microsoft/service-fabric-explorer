import { KeyValue } from '@angular/common';
import { ChangeDetectionStrategy } from '@angular/compiler';
import { literal } from '@angular/compiler/src/output/output_ast';
import { Component, ElementRef, Injector, OnDestroy, OnInit, ViewChild } from '@angular/core';
import Highcharts from 'highcharts';
import panzoom from 'panzoom';
import { Observable, of, Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { NodeEventList, PartitionEventList } from 'src/app/Models/DataModels/collections/Collections';
import { NodeEvent, PartitionEvent } from 'src/app/Models/eventstore/Events';
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
  phase?: string;
  isSeed?: boolean;
  id?: string;
  instanceId?: string;
  inCluster?: boolean;
  FM?: boolean;
  FMM?: boolean;
  leaseStates?: Map<string, string>;
}

// declare let panzoom: any ;
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
  nameToIdMap = new Map<string, string>();
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

      //var instance = panzoom(document.getElementById('container'));
  }

  ngOnDestroy() {
    this.debouncerHandlerSubscription.unsubscribe();
  }

  onChangeInput(event: any){
    let id: string = event.target.value;
    let node: NodeData = this.nodesMap.get(id);
    if (node == undefined) {
      this.setup();
      return;
    }

    let leaseNames = [...node.leaseStates.keys()]
    let mapArray = [...this.nodesMap].sort((a, b) => a[0].localeCompare(b[0]));
    /*mapArray = mapArray.filter((elem) => {
      return elem[0] == id  || leaseNames.includes(elem[0])
    });*/
    mapArray = mapArray.filter(elem => elem[0] == id  || leaseNames.includes(elem[0]));
    let len = mapArray.length;
    let ddata = [];
    if (len > 0) {
      let j: number = this.neighSize;
      let k: number = 0;
      for (k = 0; k < len; ++k)
        if (mapArray[k][0] == id)
          break;
      for (let i = k; i < len+k-1; ++i)
        ddata.push([mapArray[(i+j+1)%len][1].name, mapArray[(i+j+2)%len][1].name]);
      //if (len > 2)
        //ddata.push([mapArray[len-1][1].name, mapArray[0][1].name]);
    }

    // forming data for node hover
    let nodeHover = [];
    for (let node of mapArray) {
      // let leaseArray = [...node[1].leaseStates].sort((a, b) => a[0].localeCompare(b[0]));
      let leaseArray = [...node[1].leaseStates];
      let leaseString: string = "";
      for (let lease of leaseArray) 
        leaseString += this.nodesMap.get(lease[0]).name + "[" + lease[1] + "] ";

      let struct = {
        'id': node[1].name,
        title: 
          "Status: " + node[1].status + 
          "<br/>Phase: " + node[1].phase +
          "<br/>IsSeed: " + node[1].isSeed +
          "<br/>NodeId: " + node[1].id +
          "<br/>NodeInstance: " + node[1].instanceId + 
          "<br/>Neighborhood: " + leaseString + 
          (node[1].FM ? "<br/>FM" : "") + 
          (node[1].FMM ? "<br/>FMM" : ""),
        color: this.getNodeColor(node[1])
      };
      nodeHover.push(struct);
    }
  
    // forming graph
    this.fillHighchart(nodeHover, ddata, len, false, 'Neighborhood ' + node.name);
  }

  onClickRadio(event: any) {
    let mapArray = [...this.nodesMap].sort((a, b) => a[0].localeCompare(b[0]));
    let id: string = event.target.id;
    
    switch (id) {
      case "fmAction":
        mapArray = mapArray.filter(elem => elem[1].FM);
        break;
      case "fmmAction":
        mapArray = mapArray.filter(elem => elem[1].FMM);
        break;
      case "seedAction":
        mapArray = mapArray.filter(elem => elem[1].isSeed);
        break;
      case "notUpAction":
        mapArray = mapArray.filter(elem => elem[1].status != "Up");
        break;
      case "leaseAction":
        mapArray = mapArray.filter(elem => {
          for (let state of elem[1].leaseStates.values())
            if (state == "F") return true;
        });
        break;
      default:
        mapArray = [];
        break;
    }

    let str: string = "";
    for (let node of mapArray) {
      str += "<option>" + node[1].name + "</option>";
    }
    if (str != "") str = "<option>Nodes</option>" + str;
    document.getElementById('selectActions').innerHTML = str;
  }

  onChangedCombo(event: any) {
    let select: HTMLSelectElement = document.getElementById('selectActions') as HTMLSelectElement;
    if (select.innerHTML.startsWith("<option>Nodes</option>"))
      select.remove(0);
    let hie: HTMLInputElement = document.getElementById('inputNode') as HTMLInputElement;
    hie.value = this.nameToIdMap.get(event.target.value);
    hie.dispatchEvent(new Event('change'));
  }

  setup() {
    this.data.getClusterManifest().subscribe(manifest => {
      if (manifest.isEventStoreEnabled) {
        // collecting required events and filtering based on timeline bar
        this.eventStoreHandler = this.data.getNodeEventData();
        this.eventStoreHandlerFM = this.data.getPartitionEventData();
        this.eventStoreHandler.setDateWindow(this.startDate, this.endDate);
        this.eventStoreHandlerFM.setDateWindow(this.startDate, this.endDate);

        // processing of node events
        this.eventStoreHandler.eventsList.refresh().subscribe(success => {
          if (!success) this.failedToLoadEvents = true;
          else {
            let FMMNodeId: string = "";
            this.nodesMap.clear();
            this.nameToIdMap.clear();
            for (let elem of this.eventStoreHandler.eventsList.collection) {
              let node: NodeData;
              let currName = elem.raw.nodeName;
              let id: string;
              // recognition of selected node events and logics implementation
              switch (elem.raw.kind) {
                case "NodePhaseChanged":
                  id = elem.raw.eventProperties.NodeId;
                  if (!this.nodesMap.has(id)) {
                    node = {
                      status: "Down",
                      phase: elem.raw.eventProperties.State,
                      isSeed: false,
                      id: id,
                      inCluster: false,
                      FM: false,
                      FMM: false,
                      leaseStates: new Map<string, string>()
                    };
                    this.nodesMap.set(id, node);
                  }
                  else {
                    node = this.nodesMap.get(id);
                    node.phase = elem.raw.eventProperties.State;
                  }
                  break;
                case "LeaseChanged":
                  let indLocal: number = elem.raw.eventProperties.NodeIdLocal.indexOf(":");
                  let indRemote: number = elem.raw.eventProperties.NodeIdRemote.indexOf(":");
                  let idLocal: string = elem.raw.eventProperties.NodeIdLocal.substring(0, indLocal);
                  let idRemote: string = elem.raw.eventProperties.NodeIdRemote.substring(0, indRemote);
                  let nodeLocal: NodeData = this.nodesMap.get(idLocal);
                  let nodeRemote: NodeData = this.nodesMap.get(idRemote);
                  let lease: string = elem.raw.eventProperties.LeaseState;
                  if (lease == "Established")
                    nodeLocal.leaseStates.set(idRemote, "E");
                  else if (lease == "Failed")
                    nodeLocal.leaseStates.set(idRemote, "F");
                  else
                    nodeLocal.leaseStates.delete(idRemote);
                  break;
                case "NodeOpenSucceeded":
                  if (!this.nameToIdMap.has(currName)) {
                    id = elem.raw.eventProperties.NodeId;
                    this.nameToIdMap.set(currName, id);
                    node = this.nodesMap.get(id);
                    node.name = currName;
                    node.isSeed = elem.raw.eventProperties.IsSeedNode;
                    node.instanceId = elem.raw.eventProperties.NodeInstance;
                  }
                  else {
                    id = this.nameToIdMap.get(currName);
                    node = this.nodesMap.get(id);
                    node.isSeed = elem.raw.eventProperties.IsSeedNode;
                    node.instanceId = elem.raw.eventProperties.NodeInstance
                    node.FM = false;
                    node.FMM = false;
                  }
                  break;
                case "NodeClosed":
                  // not sure what should happen here
                  id = this.nameToIdMap.get(currName);
                  this.nodesMap.delete(id);
                  break;
                case "NodeAddedToCluster":
                  id = this.nameToIdMap.get(currName);
                  node = this.nodesMap.get(id);
                  node.inCluster = true;
                  break;
                case "NodeRemovedFromCluster":
                  // not sure what should happen here
                  id = this.nameToIdMap.get(currName);
                  node = this.nodesMap.get(id)
                  node.inCluster = false;
                  // this.nodesMap.delete(currName);
                  break;
                case "NodeUp":
                  id = this.nameToIdMap.get(currName);
                  // this.test = currName;
                  node = this.nodesMap.get(id);
                  node.status = "Up";
                  break;
                case "NodeDown":
                  id = this.nameToIdMap.get(currName);
                  node = this.nodesMap.get(id);
                  node.status = "Down";
                  break;
                case "GrayNode":
                  id = this.nameToIdMap.get(currName);
                  node = this.nodesMap.get(id);
                  node.status = "Gray";
                  break;
                case "FMMUp":
                  FMMNodeId = elem.raw.eventProperties.NodeId;
                  break;
              }
            }

            // set the FMM info
            if (FMMNodeId != "") {
              let node = this.nodesMap.get(FMMNodeId);
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
              if (fmName != "") {
                let id: string = this.nameToIdMap.get(fmName);
                this.nodesMap.get(id).FM = true;
              }
              
              // forming data for graph in ascending order of node ids
              let mapArray = [...this.nodesMap].sort((a, b) => a[1].id.localeCompare(b[1].id));
              let len = mapArray.length;
              let ddata = [];
              if (len > 0) {
                for (let i = 0; i < len-1; ++i)
                  ddata.push([mapArray[i][1].name, mapArray[i+1][1].name]);
                if (len > 2)
                  ddata.push([mapArray[len-1][1].name, mapArray[0][1].name]);
              }
            
              // forming data for node hover
              let nodeHover = [];
              for (let node of mapArray) {
                // let leaseArray = [...node[1].leaseStates].sort((a, b) => a[0].localeCompare(b[0]));
                let leaseArray = [...node[1].leaseStates];
                let leaseString: string = "";
                for (let lease of leaseArray) 
                  leaseString += this.nodesMap.get(lease[0]).name + "[" + lease[1] + "] ";

                let struct = {
                  'id': node[1].name,
                  title: 
                    "Status: " + node[1].status + 
                    "<br/>Phase: " + node[1].phase +
                    "<br/>IsSeed: " + node[1].isSeed +
                    "<br/>NodeId: " + node[1].id +
                    "<br/>NodeInstance: " + node[1].instanceId + 
                    "<br/>Neighborhood: " + leaseString + 
                    (node[1].FM ? "<br/>FM" : "") + 
                    (node[1].FMM ? "<br/>FMM" : ""),
                  color: this.getNodeColor(node[1])
                };
                nodeHover.push(struct);
              }
            
              // forming graph
              this.fillHighchart(nodeHover, ddata, len, true, 'Federation');
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

  fillHighchart(nodeHover: any[], ddata: any[], len: number, indicator: boolean, text: string): void {
    let nSize = this.neighSize;
    Highcharts.chart('container', {
      chart: {
        renderTo: 'container',
        type: 'networkgraph',
        height: 700
        //width: null
      },
      title: {
        text: text
      },
      plotOptions: {
        networkgraph: {
          keys: ['from', 'to'],
          layoutAlgorithm: {
          enableSimulation: false
          //friction: -0.9
          },
          point: {
            events: {
              click(e) {
                if (!e.point.options.selected) {
                  //e.point.options.color = '#5db7fa';
                  let id: string = e.point.options.id;
                  let txt: string = e.point.options.title;
                  id = 'Node information: ' + id + '\n';
                  txt = txt.split('<br/>').join('\n');
                  document.getElementById('labInfos').innerHTML = id;
                  document.getElementById('infos').innerHTML = txt;
                }
                else {
                  //e.point.options.color = '#c0f77b';
                  document.getElementById('labInfos').innerHTML = 'Node information:\n';
                  document.getElementById('infos').innerHTML = '';
                }
              }
            }
          }
        }
      },
      tooltip: {
        formatter: function() {
          let ind = this.point.index;
          if (indicator) {
            for (let i = 1; i < nSize; ++i) {
              let ind1 = (ind+i)%len;
              let ind2 = ind-i-1;
              if (ind2 < 0) ind2 += len;
              this.series.data[ind1].setState('');
              this.series.data[ind2].setState('');
            }
          }
    
          const {
            title
          } = this.point.options;
          return title;
        }
      },
      series: [{
        layoutAlgorithm: {
          initialPositions: "circle",
          //integration: 'euler'
          //linkLength: 1000
        },
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
