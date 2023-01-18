import { Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { Observable, of, Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { NodeEventList, PartitionEventList } from 'src/app/Models/DataModels/collections/Collections';
import { NodeEvent, PartitionEvent } from 'src/app/Models/eventstore/Events';
import { IOnDateChange } from 'src/app/modules/event-store/double-slider/double-slider.component';
import { IEventStoreData, IQuickDates } from 'src/app/modules/event-store/event-store/event-store.component';
import { IOptionConfig } from 'src/app/modules/event-store/option-picker/option-picker.component';
import { DataService } from 'src/app/services/data.service';
import { TelemetryService } from 'src/app/services/telemetry.service';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';
import { Network} from "vis-network/standalone"

// structure that has all the relevant info about particular node
export interface NodeData {
  name?: string;
  id?: string;
  status?: string;
  phase?: string;  
  isSeed?: boolean;
  openFailed?: string;
  FM?: boolean;
  FMM?: boolean;
  leaseStates?: Map<string, string>;
}

// all global variables and functions below are in needs of network click listener
// even it is called inside nonstatic method, it is local function and does not recognize "this"
// passing pointers to functions also lose information about "this", thus they are here global

// two hashmaps, since one group of events provides node names and other one node ids
let nodesMap = new Map<string, NodeData>();
let nameToIdMap = new Map<string, string>();
let neighSize: number = 2;

// data shown on node hover
function formTitle(elem: [string, NodeData]): string {
  return "Id: " + elem[1].id +
  "\nStatus: " + elem[1].status + 
  "\nPhase: " + elem[1].phase +
  (elem[1].FM ? "\nFM" : "") + 
  (elem[1].FMM ? "\nFMM" : "") +
  (elem[1].isSeed ? "\nSEED" : "") + 
  (elem[1].openFailed != "" ? "\nOpenFailed: " + elem[1].openFailed : "");
}

function getNodeColor(node: NodeData): any {
  if (node.status == "Up") return {
    border: "rgba(10,141,16,1)",
    background: "rgba(124,255,131,1)",
    highlight: {
      border: "rgba(10,141,16,1)",
      background: "rgba(0,255,1,1)",
    },
    hover: {
      border: "rgba(10,141,16,1)",
      background: "rgba(0,255,1,1)",
    }
  };
  else if (node.status == "Gray") return {
    border: "rgba(68,71,73,1)",
    background: "rgba(120,133,142,1)",
    highlight: {
      border: "rgba(68,71,73,1)",
      background: "rgba(116,123,128,1)",
    },
    hover: {
      border: "rgba(68,71,73,1)",
      background: "rgba(116,123,128,1)",
    }
  };
  else return {
    border: "rgba(143,4,4,1)",
    background: "rgba(191,35,35,1)",
    highlight: {
      border: "rgba(143,4,4,1)",
      background: "rgba(255,0,0,1)",
    },
    hover: {
      border: "rgba(143,4,4,1)",
      background: "rgba(255,0,0,1)",
    }
  };
}

// logics for creating network
function drawGraph(mode: string) {
  nodes = nodes.map((node, index, arr) => {
    let angle: number;
    if (mode == "full") {
      // make the nodes form the structure of ring
      angle = 2 * Math.PI * (index / arr.length + 0.75);
      node.x = 400 * Math.cos(angle);
      node.y = 400 * Math.sin(angle);
    }
    else {
      // make something that visually looks like neighborhood
      angle = 2 * Math.PI / 3 * (index / arr.length + 1.85);
      node.x = 1000 * Math.cos(angle);
      node.y = 1000 * Math.sin(angle);
    }
    return node;
  });
  let container = document.getElementById("mynetwork");
  let data = {
    nodes: nodes,
    edges: edges,
  };
  
  if (network !== null) {
    network.destroy();
    network = null;
  }
  network = new Network(container, data, options);

  // this option gives us possibility of "sliding" through cluster
  // after finished with forming data, correspondingly update buttons and inputs
  network.on("click", function(params) {
    if (params.nodes.length == 0) return;
    let node: NodeData = nodesMap.get(params.nodes[0]);
    formNeighborhood(node);
    let rie: HTMLInputElement = document.getElementById("noneAction") as HTMLInputElement;
    rie.checked = false;
    let nie: HTMLInputElement = document.getElementById("byId") as HTMLInputElement;
    let hie: HTMLInputElement = document.getElementById("inputNode") as HTMLInputElement;
    if (nie.checked) hie.value = node.id;
    else hie.value = node.name;
  });
}

// setting data for node's neighborhood, but also data that does not
// belong to node's neighborhood, but could be of interest as well to look at.
// for example, near nodes that are down or failed on arbitration
function formNeighborhood(node: NodeData) {
  let mapArray = [...nodesMap].sort((a, b) => a[0].localeCompare(b[0]));

  // if the selected node is for example "down" one, it does not belong to federation
  // but is still present in cluster and we want to show it. hence, we are showing
  // the neighborhood of nearest healthy node (inside where "down" node is also going to be shown)
  if (node.status != "Up" && node.status != "Gray") {
    let index = mapArray.findIndex(elem => elem[0] == node.id) - 1;
    let len = mapArray.length;
    while (mapArray[(index)%len][1].status != "Up" && mapArray[(index)%len][1].status != "Gray") --index;
    node = mapArray[index%len][1];
  }

  nodes = []; edges = [];
  let neighborhd = [...node.leaseStates.keys()];
  let localMapArray = mapArray.filter(elem => elem[0] == node.id || neighborhd.includes(elem[0]) || (elem[1].status != "Up" && elem[1].status != "Gray"));
  
  // make the central node has the same amount of neighbors on each side if possible
  let lCnt = 0;
  for (let elem of localMapArray) {
    if (elem[0] == node.id) break;
    if (elem[1].status == "Up" || elem[1].status == "Gray") ++lCnt;
  }
  let rCnt = neighborhd.length - lCnt;
  let remaining = neighborhd.length % 2;
  while (rCnt - lCnt - remaining > 0) {
    // to the right
    let elem = localMapArray.pop();
    if (elem[1].status == "Up" || elem[1].status == "Gray") ++lCnt, --rCnt;
    localMapArray.unshift(elem);
  }
  while (lCnt - rCnt - remaining > 0) {
    // to the left
    let elem = localMapArray.shift();
    if (elem[1].status == "Up" || elem[1].status == "Gray") --lCnt, ++rCnt;
    localMapArray.push(elem);
  }

  if (neighborhd.length >= 2 * neighSize) {
    let first, last;
    for (first = 0; first < localMapArray.length; ++first) 
      if (localMapArray[first][1].status == "Up" || localMapArray[first][1].status == "Gray")
        break;
    for (last = localMapArray.length-1; last >= 0; --last)
      if (localMapArray[last][1].status == "Up" || localMapArray[last][1].status == "Gray")
        break;
    localMapArray.splice(last+1, localMapArray.length-1-last);
    localMapArray.splice(0, first);
  }

  // form nodes and their connections
  let ln = localMapArray.length;
  if (ln > 0) {
    for (let i = 0; i < ln; ++i) {
      let elem = localMapArray[i];
      let title: string = formTitle(elem);
      nodes.push({ id: elem[1].id, label: " " + elem[1].name + " ", title: title, color: getNodeColor(elem[1]) });
    }
    let k = localMapArray.findIndex(elem => elem[0] == node.id);
    let neighborhood = [...localMapArray[k][1].leaseStates];
    for (let nElem of neighborhood)
      edges.push({ from: localMapArray[k][1].id, to: nElem[0] });
    drawGraph("neighborhood");
  }
}

let nodes = [];
let edges = [];
let network = null;
var options = {
  physics: false,
  layout: {
    improvedLayout: true,
    hierarchical: {
      enabled: false,
      nodeSpacing: 100
    }
  },
  nodes: {
    shape: "circle",
    font: {
      size: 32,
      color: "#000000",
    },
    color: {
      border: "rgba(10,141,16,1)",
      background: "rgba(124,255,131,1)",
      highlight: {
        border: "rgba(10,141,16,1)",
        background: "rgba(0,255,1,1)",
      },
      hover: {
        border: "rgba(10,141,16,1)",
        background: "rgba(0,255,1,1)",
      }
    },
    borderWidth: 2,
  },
  edges: {
    width: 1,
    hoverWidth: 10,
    color: {
      color: "rgba(10,141,16,0.3)",
      hover: "rgba(10,141,16,1)"
    }
  },
  interaction: {
    tooltipDelay: 0,
    hideEdgesOnDrag: true,
    hideEdgesOnZoom: true,
    hover: true
  }
};

@Component({
  selector: 'app-federation',
  templateUrl: './federation.component.html',
  styleUrls: ['./federation.component.scss']
})
export class FederationComponent extends BaseControllerDirective implements OnInit, OnDestroy {
  // nodeEvents
  eventStoreHandler: IEventStoreData<NodeEventList, NodeEvent>;
  eventStoreHandlerSubscription: Subscription;
  // partitionEvents, but only the FM related
  eventStoreHandlerFM: IEventStoreData<PartitionEventList, PartitionEvent>;
  eventStoreHandlerFMSubscription: Subscription;
  failedToLoadEvents: boolean;

  // timeline bar and dates related settings
  optionsConfig: IOptionConfig;
  private debounceHandler: Subject<IOnDateChange> = new Subject<IOnDateChange>();
  private debouncerHandlerSubscription: Subscription;
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

    // timeline bar config
    this.optionsConfig = {
      enableNodes: true,
      enableRepairTasks: true
    };

    // setting up the timeline bar
    // debounceTime is wanted delay for frequent bar changes
    this.resetSelectionProperties();
    this.debouncerHandlerSubscription = this.debounceHandler
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(dates => {
        this.startDate = new Date(dates.startDate);
        this.endDate = new Date(dates.endDate);
    });
  }

  ngOnDestroy() {
    // free the resources
    this.debouncerHandlerSubscription.unsubscribe();
    // this.eventStoreHandlerFMSubscription.unsubscribe();
    // this.eventStoreHandlerSubscription.unsubscribe();
  }

  // represent selected node's neighborhood
  onChangeInput(event: any){
    let hie: HTMLInputElement = document.getElementById("byName") as HTMLInputElement;
    let node: NodeData;
    if (hie.checked) {
      let currName: string = event.target.value;
      let id: string = nameToIdMap.get(currName);
      node = nodesMap.get(id);
    }
    else {
      let id: string = event.target.value;
      node = nodesMap.get(id);
    }
    if (node == undefined) {
      this.setup();
      return;
    }
    formNeighborhood(node);
  }

  // fill selection list properly
  onClickRadio(event: any) {
    let mapArray = [...nodesMap].sort((a, b) => a[0].localeCompare(b[0]));
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
      case "downAction":
        mapArray = mapArray.filter(elem => elem[1].status == "Down");
        break;
      case "leaseAction":
        mapArray = mapArray.filter(elem => elem[1].status == "OnLeaseFailed");
        break;
      case "openAction":
        mapArray = mapArray.filter(elem => elem[1].openFailed != "");
        break;
      case "grayAction":
        mapArray = mapArray.filter(elem => elem[1].status == "Gray");
        break;
      default:
        mapArray = [];
        let hie: HTMLInputElement = document.getElementById('inputNode') as HTMLInputElement;
        hie.value = "";
        hie.dispatchEvent(new Event('change'));
        break;
    }

    let str: string = "";
    for (let node of mapArray) {
      str += "<option>" + node[1].name + "</option>";
    }
    if (str != "") str = "<option>Nodes</option>" + str;
    document.getElementById('selectActions').innerHTML = str;
  }

  // represent selected node's neighborhood
  onChangeCombo(event: any) {
    let select: HTMLSelectElement = document.getElementById('selectActions') as HTMLSelectElement;
    if (select.innerHTML.startsWith("<option>Nodes</option>"))
      select.remove(0);
    let rie: HTMLInputElement = document.getElementById("byId") as HTMLInputElement;
    rie.checked = true;
    let hie: HTMLInputElement = document.getElementById('inputNode') as HTMLInputElement;
    hie.value = nameToIdMap.get(event.target.value);
    hie.dispatchEvent(new Event('change'));
  }

  // collecting required events and filtering based on timeline bar
  setEventStoreHandlers() {
    this.eventStoreHandler = this.data.getNodeEventData();
    this.eventStoreHandlerFM = this.data.getPartitionEventData();
    // Error: E_INVALIDARG
    // Message: EventType PartitionReconfigured Not Supported for Entity Partition
    // this.eventStoreHandlerFM.eventsList.setEventFilter(["PartitionReconfigured"]);
    this.eventStoreHandler.setDateWindow(this.startDate, this.endDate);
    this.eventStoreHandlerFM.setDateWindow(this.startDate, this.endDate);
  }

  // this method represents the core functionality
  // recognition of persisent node events and their processing
  // return from the function is the id of node where FMM is positioned
  handleNodeEvents(): string {
    let FMMNodeId: string = "";
    for (let elem of this.eventStoreHandler.eventsList.collection) {
      let node: NodeData;
      let currName: string;
      let id: string;
      switch (elem.raw.kind) {
        case "NodePhaseChanged":
          id = elem.raw.eventProperties.NodeId;
          let phase = elem.raw.eventProperties.State;
          // if it's new node, add it to the hashmap with initial values
          // predefined values are not correct yet, going to be set through other events
          if (!nodesMap.has(id)) {
            // since this event could be propagated because is node getting removed from cluster
            if (phase == "Shutdown") break;
            node = {
              name: "",
              id: id,
              status: "Down",
              phase: phase,
              isSeed: false,
              openFailed: "",
              FM: false,
              FMM: false,
              leaseStates: new Map<string, string>(),
            };
            nodesMap.set(id, node);
          }
          else {
            node = nodesMap.get(id);
            // in case of node being stuck or failed on open
            if (node.phase != "Routing" && phase == "Shutdown")
              node.openFailed = "Node didn't pass " + node.phase + " phase";
            node.phase = phase;
            node.FM = false;
            node.FMM = false;
          }
          break;
        case "LeaseChanged":
          // extract id from event property and get nodes which this lease is operating with
          let indLocal: number = elem.raw.eventProperties.NodeIdLocal.indexOf(":");
          let indRemote: number = elem.raw.eventProperties.NodeIdRemote.indexOf(":");
          let idLocal: string = elem.raw.eventProperties.NodeIdLocal.substring(0, indLocal);
          let idRemote: string = elem.raw.eventProperties.NodeIdRemote.substring(0, indRemote);
          // in case this event happens after node is being removed from cluster
          if (nodesMap.has(idLocal)) {
            let nodeLocal: NodeData = nodesMap.get(idLocal);
            let lease: string = elem.raw.eventProperties.LeaseState;
            if (lease == "Established") nodeLocal.leaseStates.set(idRemote, "E");
            else nodeLocal.leaseStates.delete(idRemote);
          }
          break;
        case "OnLeaseFailed":
          id = elem.raw.eventProperties.NodeId;
          if (nodesMap.has(id)) {
            node = nodesMap.get(id);
            // this is not "real" node status (since it could be only up/down)
            // but we extracted this in order to show narrower subset of details
            node.status = "OnLeaseFailed";
            node.FM = false;
            node.FMM = false;
          }
          break;
        case "NodeOpenSucceeded":
          id = elem.raw.eventProperties.NodeId;
          node = nodesMap.get(id);
          node.isSeed = elem.raw.eventProperties.IsSeedNode;
          node.openFailed = "";
          currName = elem.raw.nodeName;
          // node must be in nodesMap (since NodePhaseChanged must happened before)
          // but it could not be in nameToIdMap (since this is the first event that 
          // occurs and does not provide node id in itself)
          if (!nameToIdMap.has(currName)) {
            nameToIdMap.set(currName, id);
            node.name = currName;
          }
          else {
            node.FM = false;
            node.FMM = false;
          }
          break;
        case "NodeOpenFailed":
          id = elem.raw.eventProperties.NodeId;
          node = nodesMap.get(id);
          node.isSeed = elem.raw.eventProperties.IsSeedNode;
          node.openFailed = elem.raw.eventProperties.Error;
          currName = elem.raw.nodeName;
          // same reason as previous event
          if (!nameToIdMap.has(currName)) {
            nameToIdMap.set(currName, id);
            node.name = currName;
          }
          else {
            node.FM = false;
            node.FMM = false;
          }
          break;
        case "NodeRemovedFromCluster":
          id = elem.raw.eventProperties.NodeId;
          currName = elem.raw.nodeName;
          nodesMap.delete(id);
          nameToIdMap.delete(currName);
          break;
        case "NodeUp":
          currName = elem.raw.nodeName;
          id = nameToIdMap.get(currName);
          node = nodesMap.get(id);
          // since this event is fired even if node is gray one, we must handle this
          // the only way to fix gray node issue is either restart node or shutdown and then turn it up again
          // when we are restarting node, NodeDown event is happening
          // when node goes up again, it will have its status set on "Down"
          // when we shutdown node, it is because we shutdowned it or some error happened
          // when node goes up again, its status is set on "Down" or "OnLeaseFailed"
          if (node.status == "Down" || node.status == "OnLeaseFailed") node.status = "Up";
          node.FM = false;
          node.FMM = false;
          break;
        case "NodeDown":
          currName = elem.raw.nodeName;
          if (nameToIdMap.has(currName)) {
            id = nameToIdMap.get(currName);
            node = nodesMap.get(id);
            // we do not to override this situation (since it is narrower)
            if (node.status != "OnLeaseFailed")
              node.status = "Down";
            node.FM = false;
            node.FMM = false;
          }
          break;
        case "GrayNode":
          id = elem.raw.eventProperties.NodeId;
          node = nodesMap.get(id);
          node.status = "Gray";
          node.FM = false;
          node.FMM = false;
          // since this situation is recognized before NodeOpenSucceeded (ReliabilityOpenFailed.test.trace)
          if (!nameToIdMap.has(currName)) {
            nameToIdMap.set(currName, id);
            node.name = currName;
          }
          break;
        case "FMMUp":
          // keep track of only last one
          FMMNodeId = elem.raw.eventProperties.NodeId;
          break;
      }
    }
    return FMMNodeId;
  }

  // recognition and processing of only FM relevant event for us (PartitionReconfigured)
  handleFMEvents() {
    let partitionToName = new Map<string, string>();
    for (let i = 0; i < this.eventStoreHandlerFM.eventsList.collection.length; ++i) {
      let fmElem = this.eventStoreHandlerFM.eventsList.collection[i];
      if (fmElem.raw.kind == 'PartitionReconfigured' && fmElem.raw.eventProperties.ServiceType == 'FMServiceType')
        partitionToName.set(fmElem.raw.partitionId, fmElem.raw.raw.NodeName);
    }
    for (let elem of partitionToName) {
      let id: string = nameToIdMap.get(elem[1]);
      nodesMap.get(id).FM = true;
    }
  }

  // overriden method that implements logics of reading and parsing events
  setup() {
    this.data.getClusterManifest().subscribe(manifest => {
      if (manifest.isEventStoreEnabled) {
        // setup of the subscriptions and their filling with events
        this.setEventStoreHandlers();

        // processing of node events
        this.eventStoreHandlerSubscription = this.eventStoreHandler.eventsList.refresh().subscribe(success => {
          if (!success) this.failedToLoadEvents = true;
          else {
            nodesMap.clear();
            nameToIdMap.clear();
            // filling of the hashmaps with collected data
            let FMMNodeId = this.handleNodeEvents();

            // setting up the FMM info
            if (FMMNodeId != "") {
              let node = nodesMap.get(FMMNodeId);
              node.FMM = true;
            }

            // processing of FM events
            this.eventStoreHandlerFMSubscription = this.eventStoreHandlerFM.eventsList.refresh().subscribe(success => {
              if (!success) this.failedToLoadEvents = true;
              else {
                // getting information about primary replica for FM service
                this.handleFMEvents();

                // forming data for graph in ascending order of node ids
                let mapArray = [...nodesMap].sort((a, b) => a[1].id.localeCompare(b[1].id));
                let len = mapArray.length;
                nodes = []; edges = [];
                //let nodes: { id?: string; label?: string; title?: string; x?: number; y?: number; }[] = [];
                //let edges: { id?: number; from?: string; to?: string; color?: string; }[] = [{ id: 1 }];
                let lUpCnt = 0, lDownCnt = 0, lGrayCnt = 0;
                for (let elem of mapArray) {
                  let title: string = formTitle(elem);
                  nodes.push({ id: elem[1].id, label: " " + elem[1].name + " ", title: title, color: getNodeColor(elem[1]) });
                  let neighborhood = [...elem[1].leaseStates];
                  for (let nElem of neighborhood)
                    edges.push({ from: elem[1].id, to: nElem[0] });
                  if (elem[1].status == "Up") ++lUpCnt;
                  else if (elem[1].status == "Gray") ++lGrayCnt;
                  else lDownCnt++;
                }
                drawGraph("full");
                let lUp = document.getElementById('labUp'); lUp.innerText = "Number of UP nodes: " + lUpCnt;
                let lDown = document.getElementById('labDown'); lDown.innerText = "Number of DOWN nodes: " + lDownCnt;
                let lGray = document.getElementById('labGray'); lGray.innerText = "Number of GRAY nodes: " + lGrayCnt;
              }
            });
            
          }
        });
      }
    });
  }

  // method being called when customer clicks Refresh button in SFX
  // since Refresh rate can be set to some predefine time (ie, 5 seconds)
  // this is probably place we don't want to call logics from, especially for big clusters
  // because that would take a lot oftime (since we are looping through all of them)
  // therefore, logics implemented should be removed from here and put into ngOnInit() inside subscription
  // reason for staying in here currently is because of testing needs (timeline bar is not working in mock regime)
  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    // this.setup();
    let hre: HTMLInputElement = document.getElementById('noneAction') as HTMLInputElement;
    hre.checked = true; 
    hre.dispatchEvent(new Event('click'));
    return of(null);
  }

  // timeline bar restart
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
