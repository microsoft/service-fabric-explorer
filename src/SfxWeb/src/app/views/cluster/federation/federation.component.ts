import { Component, ElementRef, Injector, OnInit, SecurityContext, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { NodeEventList, PartitionEventList } from 'src/app/Models/DataModels/collections/Collections';
import { NodeEvent, PartitionEvent } from 'src/app/Models/eventstore/Events';
import { IEventStoreData } from 'src/app/modules/event-store/event-store/event-store.component';
import { DataService } from 'src/app/services/data.service';
import { TelemetryService } from 'src/app/services/telemetry.service';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';
import { Network} from "vis-network/standalone"
import { DomSanitizer} from '@angular/platform-browser';
import { IOnDateChange } from 'src/app/modules/time-picker/double-slider/double-slider.component';
import { TimeUtils } from 'src/app/Utils/TimeUtils';

// structure that has all the relevant info about particular node
export interface NodeData {
  name: string;
  id: string;
  status: string;
  phase: string;  
  isSeed: boolean;
  openFailed: string;
  FM: boolean;
  FMM: boolean;
  leaseStates: Map<string, string>;
  ip: string;
  badConnections: Map<string, string[]>;
}

@Component({
  selector: 'app-federation',
  templateUrl: './federation.component.html',
  styleUrls: ['./federation.component.scss']
})
export class FederationComponent extends BaseControllerDirective implements OnInit {
  // nodeEvents
  eventStoreHandler: IEventStoreData<NodeEventList, NodeEvent>;
  eventStoreHandlerSubscription: Subscription;
  // partitionEvents, but only the FM related
  eventStoreHandlerFM: IEventStoreData<PartitionEventList, PartitionEvent>;
  eventStoreHandlerFMSubscription: Subscription;
  failedToLoadEvents: boolean;
  // two hashmaps, since one group of events provides node names and other one node ids
  nodesMap = new Map<string, NodeData>();
  nameToIdMap = new Map<string, string>();
  ipToNode = new Map<string, NodeData>();
  neighSize: number = 2;
  // graph representation structures and options
  nodes: any[] = [];
  edges: any[] = [];
  network: Network = null;
  options = {
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
        hover: "rgba(10,141,16,1)",
      }
    },
    interaction: {
      tooltipDelay: 0,
      hideEdgesOnDrag: true,
      hideEdgesOnZoom: true,
      hover: true
    }
  };
  // constants
  static readonly CONST = {
    STATUS_GRAY: "Gray",
    STATUS_UP: "Up",
    STATUS_DOWN: "Down",
    STATUS_LEASE_FAILED: "OnLeaseFailed",
    COLOR_GREEN_BORDER: "rgba(10, 141, 16, 1)",
    COLOR_GREEN_PALE: "rgba(124, 255, 131, 1)",
    COLOR_GREEN: "rgba(0, 255, 1, 1)",
    COLOR_RED_BORDER: "rgba(143, 4, 4, 1)",
    COLOR_RED_PALE: "rgba(191, 35, 35, 1)",
    COLOR_RED: "rgba(255, 0, 0, 1)",
    COLOR_GRAY_BORDER: "rgba(68, 71, 73, 1)",
    COLOR_GRAY_PALE: "rgba(120, 133, 142, 1)",
    COLOR_GRAY: "rgba(116, 123, 128, 1)"
  }
  // HTML elements of interest
  @ViewChild("inputNode") inputNode: ElementRef;
  @ViewChild("byId") byId: ElementRef;
  @ViewChild("noneAction") noneAction: ElementRef;
  @ViewChild("myNetwork") myNetwork: ElementRef;
  @ViewChild("onlyTransp") onlyTransp: ElementRef;
  // data binding
  selectionArr: string[] = [];
  funcList: any[] = [
    {
      id: "noneAction",
      text: "None"
    },
    {
      id: "fmAction",
      text: "FM nodes"
    },
    {
      id: "fmmAction",
      text: "FMM node"
    },
    {
      id: "seedAction",
      text: "Seed nodes"
    },
    {
      id: "downAction",
      text: "Down nodes"
    },
    {
      id: "leaseAction",
      text: "Lease failed nodes"
    },
    {
      id: "openAction",
      text: "Open failed nodes"
    },
    {
      id: "grayAction",
      text: "Gray nodes"
    },
    {
      id: "badAction",
      text: "Nodes with bad connections"
    }
  ]
  labList: any[] = [
    {
      id: "labUp",
      text: "Number of UP nodes:",
      cnt: 0
    },
    {
      id: "labDown",
      text: "Number of DOWN nodes:",
      cnt: 0
    },
    {
      id: "labGray",
      text: "Number of GRAY nodes:",
      cnt: 0
    },
  ]
  // time-picker
  public dateMin: Date = TimeUtils.AddDays(new Date(), -30);
  public startDate: Date;
  public endDate: Date;

  constructor(protected data: DataService, injector: Injector, private telemService: TelemetryService, private sanitized: DomSanitizer) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
  }

  // represent selected node's neighborhood
  onChangeInput(event: any){
    let node: NodeData;
    if (this.byId.nativeElement.checked) {
      let id: string = event.target.value;
      node = this.nodesMap.get(id);
    }
    else {
      let currName: string = event.target.value;
      let id: string = this.nameToIdMap.get(currName);
      node = this.nodesMap.get(id);
    }
    if (node == undefined) {
      this.setup();
      return;
    }
    this.formNeighborhood(node);
  }

  // fill selection list properly
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
      case "downAction":
        mapArray = mapArray.filter(elem => (
          elem[1].status == FederationComponent.CONST.STATUS_DOWN ||
          elem[1].status == FederationComponent.CONST.STATUS_LEASE_FAILED ||
          elem[1].openFailed != ""
        ));
        break;
      case "leaseAction":
        mapArray = mapArray.filter(elem => elem[1].status == FederationComponent.CONST.STATUS_LEASE_FAILED);
        break;
      case "openAction":
        mapArray = mapArray.filter(elem => elem[1].openFailed != "");
        break;
      case "grayAction":
        mapArray = mapArray.filter(elem => elem[1].status == FederationComponent.CONST.STATUS_GRAY);
        break;
      case "badAction":
        mapArray = mapArray.filter(elem => elem[1].badConnections.size != 0);
        break;
      default:
        mapArray = [];
        this.inputNode.nativeElement.value = "";
        this.inputNode.nativeElement.dispatchEvent(new Event('change'));
        break;
    }

    this.selectionArr = [];
    for (let node of mapArray) this.selectionArr.push(node[1].name);
    if (this.selectionArr.length > 0) this.selectionArr.unshift("Nodes");
  }

  // represent selected node's neighborhood
  onChangeCombo(event: any) {
    if (this.selectionArr[0] == "Nodes")
      this.selectionArr.shift();
    this.byId.nativeElement.checked = true;
    this.inputNode.nativeElement.value = this.nameToIdMap.get(event.target.value);
    this.inputNode.nativeElement.dispatchEvent(new Event('change'));
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
          this.neighSize = elem.raw.eventProperties.NeighborhoodSize;
          let phase = elem.raw.eventProperties.State;
          // if it's new node, add it to the hashmap with initial values
          // predefined values are not correct yet, going to be set through other events
          if (!this.nodesMap.has(id)) {
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
              ip: "",
              badConnections: new Map<string, string[]>()
            };
            this.nodesMap.set(id, node);
          }
          else {
            node = this.nodesMap.get(id);
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
          if (this.nodesMap.has(idLocal)) {
            let nodeLocal: NodeData = this.nodesMap.get(idLocal);
            let lease: string = elem.raw.eventProperties.LeaseState;
            if (lease == "Established") nodeLocal.leaseStates.set(idRemote, "E");
            else nodeLocal.leaseStates.delete(idRemote);
          }
          break;
        case "OnLeaseFailed":
          id = elem.raw.eventProperties.NodeId;
          if (this.nodesMap.has(id)) {
            node = this.nodesMap.get(id);
            // this is not "real" node status (since it could be only up/down)
            // but we extracted this in order to show narrower subset of details
            node.status = FederationComponent.CONST.STATUS_LEASE_FAILED;
            node.FM = false;
            node.FMM = false;
          }
          break;
        case "NodeOpenSucceeded":
          id = elem.raw.eventProperties.NodeId;
          node = this.nodesMap.get(id);
          node.isSeed = elem.raw.eventProperties.IsSeedNode;
          node.openFailed = "";
          node.ip = elem.raw.eventProperties.IpAddressOrFQDN;
          this.ipToNode.set(node.ip, node);
          currName = elem.raw.nodeName;
          // node must be in nodesMap (since NodePhaseChanged must happened before)
          // but it could not be in nameToIdMap (since this is the first event that 
          // occurs and does not provide node id in itself)
          if (!this.nameToIdMap.has(currName)) {
            this.nameToIdMap.set(currName, id);
            node.name = currName;
          }
          else {
            node.FM = false;
            node.FMM = false;
          }
          break;
        case "NodeOpenFailed":
          id = elem.raw.eventProperties.NodeId;
          node = this.nodesMap.get(id);
          node.isSeed = elem.raw.eventProperties.IsSeedNode;
          node.openFailed = elem.raw.eventProperties.Error;
          currName = elem.raw.nodeName;
          // same reason as previous event
          if (!this.nameToIdMap.has(currName)) {
            this.nameToIdMap.set(currName, id);
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
          node = this.nodesMap.get(id);
          this.ipToNode.delete(node.ip);
          this.nodesMap.delete(id);
          this.nameToIdMap.delete(currName);
          break;
        case "NodeUp":
          currName = elem.raw.nodeName;
          id = this.nameToIdMap.get(currName);
          node = this.nodesMap.get(id);
          // since this event is fired even if node is gray one, we must handle this
          // the only way to fix gray node issue is either restart node or shutdown and then turn it up again
          // when we are restarting node, NodeDown event is happening
          // when node goes up again, it will have its status set on "Down"
          // when we shutdown node, it is because we shutdowned it or some error happened
          // when node goes up again, its status is set on "Down" or "OnLeaseFailed"
          if (node.status == FederationComponent.CONST.STATUS_DOWN || node.status == FederationComponent.CONST.STATUS_LEASE_FAILED) 
            node.status = FederationComponent.CONST.STATUS_UP;
          node.FM = false;
          node.FMM = false;
          break;
        case "NodeDown":
          currName = elem.raw.nodeName;
          if (this.nameToIdMap.has(currName)) {
            id = this.nameToIdMap.get(currName);
            node = this.nodesMap.get(id);
            // we do not to override this situation (since it is narrower)
            if (node.status != FederationComponent.CONST.STATUS_LEASE_FAILED)
              node.status = FederationComponent.CONST.STATUS_DOWN;
            node.FM = false;
            node.FMM = false;
          }
          break;
        case "GrayNode":
          id = elem.raw.eventProperties.NodeId;
          node = this.nodesMap.get(id);
          node.status = FederationComponent.CONST.STATUS_GRAY;
          node.FM = false;
          node.FMM = false;
          // since this situation is recognized before NodeOpenSucceeded (ReliabilityOpenFailed.test.trace)
          if (!this.nameToIdMap.has(currName)) {
            this.nameToIdMap.set(currName, id);
            node.name = currName;
          }
          break;
        case "FMMUp":
          // keep track of only last one
          FMMNodeId = elem.raw.eventProperties.NodeId;
          break;
        case "TcpConnectionState":
          let localIPs: string[] = elem.raw.eventProperties.LocalIP.split(" ");
          let remoteIPs: string[] = elem.raw.eventProperties.RemoteIP.split(" ");
          let latencies: string[] = elem.raw.eventProperties.Latency.split(" ");
          let states: string[] = elem.raw.eventProperties.State.split(" ");
          let n: number = localIPs.length;
          for (let i = 0; i < n-1; ++i) {
            let ind = localIPs[i].indexOf(":");
            let ipAddr = localIPs[i].substring(0, ind);
            let port = localIPs[i].substring(ind+1);
            let node = this.ipToNode.get(ipAddr);
            if (node == undefined) break;
            if (states[i] == "ok") node.badConnections.delete(remoteIPs[i]);
            else if (states[i] == "broken") node.badConnections.set(remoteIPs[i], [port, "-1"]);
            else node.badConnections.set(remoteIPs[i], [port, latencies[i]]);
          }
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
      let id: string = this.nameToIdMap.get(elem[1]);
      this.nodesMap.get(id).FM = true;
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
            this.nodesMap.clear();
            this.nameToIdMap.clear();
            // filling of the hashmaps with collected data
            let FMMNodeId = this.handleNodeEvents();

            // setting up the FMM info
            if (FMMNodeId != "") {
              let node = this.nodesMap.get(FMMNodeId);
              node.FMM = true;
            }

            // processing of FM events
            this.eventStoreHandlerFMSubscription = this.eventStoreHandlerFM.eventsList.refresh().subscribe(success => {
              if (!success) this.failedToLoadEvents = true;
              else {
                // getting information about primary replica for FM service
                this.handleFMEvents();

                // forming data for graph in ascending order of node ids
                let mapArray = [...this.nodesMap].sort((a, b) => a[1].id.localeCompare(b[1].id));
                let len = mapArray.length;
                this.nodes = []; this.edges = [];
                //let nodes: { id?: string; label?: string; title?: string; x?: number; y?: number; }[] = [];
                //let edges: { id?: number; from?: string; to?: string; color?: string; }[] = [{ id: 1 }];
                this.labList[0].cnt = 0;
                this.labList[1].cnt = 0;
                this.labList[2].cnt = 0;
                for (let elem of mapArray) {
                  let title: string = this.formTitle(elem);
                  this.nodes.push({ id: elem[1].id, label: " " + elem[1].name + " ", title: title, color: this.getNodeColor(elem[1]) });
                  let neighborhood = [...elem[1].leaseStates];
                  if (!this.onlyTransp.nativeElement.checked) {
                    for (let nElem of neighborhood)
                      this.edges.push({ from: elem[1].id, to: nElem[0] });
                  }
                  
                  // representing current connections' state
                  let badConnectionsMap = new Map<string, string>();
                  let badConnectionsArray = [...elem[1].badConnections]
                  for (let bElem of badConnectionsArray) {
                    let ind = bElem[0].indexOf(":");
                    let remote = bElem[0].substring(0, ind);
                    let remoteNode = this.ipToNode.get(remote);
                    // this should never happen
                    if (remoteNode == undefined) continue;
                    let port = bElem[0].substring(ind+1);
                    let hoverInfo = `\n${elem[1].name}:${bElem[1][0]}, ${remoteNode.name}:${port}, `;
                    if (bElem[1][1] == "-1") hoverInfo += "broken";
                    else hoverInfo += `high latency (${bElem[1][1]})`;
                    if (!badConnectionsMap.has(remote)) badConnectionsMap.set(remote, "Bad connections");
                    badConnectionsMap.set(remote, badConnectionsMap.get(remote) + hoverInfo);
                  }
                  let badConnectionsFlat = [...badConnectionsMap];
                  for (let bElem of badConnectionsFlat)
                    this.edges.push({ from: elem[1].id, to: this.ipToNode.get(bElem[0]).id , title: bElem[1], color: { color: "RED", hover: "RED" }, hoverWidth: 1.2 });

                  if (elem[1].status == FederationComponent.CONST.STATUS_UP) ++this.labList[0].cnt;
                  else if (elem[1].status == FederationComponent.CONST.STATUS_GRAY) ++this.labList[2].cnt;
                  else ++this.labList[1].cnt;
                }
                this.drawGraph("full");
              }
            });
            
          }
        });
      }
    });
  }

  // data shown on node hover
  formTitle(elem: [string, NodeData]): string {
    let res: string = `Id: ${elem[1].id}\nStatus: ${elem[1].status}\nPhase: ${elem[1].phase}`;
    if (elem[1].FM) res += "\nFM";
    if (elem[1].FMM) res += "\nFMM";
    if (elem[1].isSeed) res += "\nSEED";
    if (elem[1].openFailed) res += `\nOpenFailed: ${elem[1].openFailed}`;
    res = this.sanitized.sanitize(SecurityContext.STYLE, res);
    return res;
  }

  getNodeColor(node: NodeData): any {
    if (node.status == FederationComponent.CONST.STATUS_UP) return {
      border: FederationComponent.CONST.COLOR_GREEN_BORDER,
      background: FederationComponent.CONST.COLOR_GREEN_PALE,
      highlight: {
        border: FederationComponent.CONST.COLOR_GREEN_BORDER,
        background: FederationComponent.CONST.COLOR_GREEN,
      },
      hover: {
        border: FederationComponent.CONST.COLOR_GREEN_BORDER,
        background: FederationComponent.CONST.COLOR_GREEN,
      }
    };
    else if (node.status == FederationComponent.CONST.STATUS_GRAY) return {
      border: FederationComponent.CONST.COLOR_GRAY_BORDER,
      background: FederationComponent.CONST.COLOR_GRAY_PALE,
      highlight: {
        border: FederationComponent.CONST.COLOR_GRAY_BORDER,
        background: FederationComponent.CONST.COLOR_GRAY,
      },
      hover: {
        border: FederationComponent.CONST.COLOR_GRAY_BORDER,
        background: FederationComponent.CONST.COLOR_GRAY,
      }
    };
    else return {
      border: FederationComponent.CONST.COLOR_RED_BORDER,
      background: FederationComponent.CONST.COLOR_RED_PALE,
      highlight: {
        border: FederationComponent.CONST.COLOR_RED_BORDER,
        background: FederationComponent.CONST.COLOR_RED,
      },
      hover: {
        border: FederationComponent.CONST.COLOR_RED_BORDER,
        background: FederationComponent.CONST.COLOR_RED,
      }
    };
  }

  // logics for creating network
  drawGraph(mode: string) {
    this.nodes = this.nodes.map((node, index, arr) => {
      let angle: number;
      if (mode == "full") {
        // make the nodes form the structure of ring
        this.onlyTransp.nativeElement.disabled = false;
        angle = 2 * Math.PI * (index / arr.length + 0.75);
        node.x = 400 * Math.cos(angle);
        node.y = 400 * Math.sin(angle);
      }
      else {
        // make something that visually looks like neighborhood
        this.onlyTransp.nativeElement.disabled = true;
        angle = 2 * Math.PI / 3 * (index / arr.length + 1.85);
        node.x = 1000 * Math.cos(angle);
        node.y = 700 + 1000 * Math.sin(angle);
      }
      return node;
    });
    
    let data = {
      nodes: this.nodes,
      edges: this.edges,
    };
    
    if (this.network !== null) {
      this.network.destroy();
      this.network = null;
    }
    this.network = new Network(this.myNetwork.nativeElement, data, this.options);

    // this option gives us possibility of "sliding" through cluster
    // after finished with forming data, correspondingly update buttons and inputs
    this.network.on("click", (params) => {
      if (params.nodes.length == 0) return;
      let node: NodeData = this.nodesMap.get(params.nodes[0]);
      this.formNeighborhood(node);
      this.noneAction.nativeElement.checked = false;
      if (this.byId.nativeElement.checked) {
        //this.inputNodeValue = node.id;
        this.inputNode.nativeElement.value = node.id;
      }
      else {
        //this.inputNodeValue = node.name;
        this.inputNode.nativeElement.value = node.name;
      }
    });
  }

  // setting data for node's neighborhood, but also data that does not
  // belong to node's neighborhood, but could be of interest as well to look at.
  // for example, near nodes that are down or failed on arbitration
  formNeighborhood(node: NodeData) {
    let mapArray = [...this.nodesMap].sort((a, b) => a[0].localeCompare(b[0]));

    // if the selected node is for example "down" one, it does not belong to federation
    // but is still present in cluster and we want to show it. hence, we are showing
    // the neighborhood of nearest healthy node (inside where "down" node is also going to be shown)
    if (node.status != FederationComponent.CONST.STATUS_UP && node.status != FederationComponent.CONST.STATUS_GRAY) {
      let index = mapArray.findIndex(elem => elem[0] == node.id) - 1;
      let len = mapArray.length;
      while (mapArray[(index)%len][1].status != FederationComponent.CONST.STATUS_UP 
        && mapArray[(index)%len][1].status != FederationComponent.CONST.STATUS_GRAY) --index;
      node = mapArray[index%len][1];
    }

    this.nodes = []; this.edges = [];
    let neighborhd = [...node.leaseStates.keys()];
    let localMapArray = mapArray.filter(
      elem => elem[0] == node.id || 
      neighborhd.includes(elem[0]) || 
      (elem[1].status != FederationComponent.CONST.STATUS_UP && elem[1].status != FederationComponent.CONST.STATUS_GRAY)
    );
    
    // make the central node has the same amount of neighbors on each side if possible
    let lCnt = 0;
    for (let elem of localMapArray) {
      if (elem[0] == node.id) break;
      if (elem[1].status == FederationComponent.CONST.STATUS_UP || elem[1].status == FederationComponent.CONST.STATUS_GRAY) ++lCnt;
    }
    let rCnt = neighborhd.length - lCnt;
    let remaining = neighborhd.length % 2;
    while (rCnt - lCnt - remaining > 0) {
      // to the right
      let elem = localMapArray.pop();
      if (elem[1].status == FederationComponent.CONST.STATUS_UP || elem[1].status == FederationComponent.CONST.STATUS_GRAY) ++lCnt, --rCnt;
      localMapArray.unshift(elem);
    }
    while (lCnt - rCnt - remaining > 0) {
      // to the left
      let elem = localMapArray.shift();
      if (elem[1].status == FederationComponent.CONST.STATUS_UP || elem[1].status == FederationComponent.CONST.STATUS_GRAY) --lCnt, ++rCnt;
      localMapArray.push(elem);
    }

    if (neighborhd.length >= 2 * this.neighSize) {
      let first, last;
      for (first = 0; first < localMapArray.length; ++first) 
        if (localMapArray[first][1].status == FederationComponent.CONST.STATUS_UP || localMapArray[first][1].status == FederationComponent.CONST.STATUS_GRAY)
          break;
      for (last = localMapArray.length-1; last >= 0; --last)
        if (localMapArray[last][1].status == FederationComponent.CONST.STATUS_UP || localMapArray[last][1].status == FederationComponent.CONST.STATUS_GRAY)
          break;
      localMapArray.splice(last+1, localMapArray.length-1-last);
      localMapArray.splice(0, first);
    }

    // form nodes and their connections
    let ln = localMapArray.length;
    if (ln > 0) {
      for (let i = 0; i < ln; ++i) {
        let elem = localMapArray[i];

        // extract informations from the map and form bad connections data
        // every node shown in current neighborhood will have this information
        let infoToShow: string = "";
        let badConnectionsArray = [...elem[1].badConnections].sort((a, b) => a[0].localeCompare(b[0]));
        for (let bElem of badConnectionsArray) {
          let ind = bElem[0].indexOf(":");
          let remote = bElem[0].substring(0, ind);
          let remoteNode = this.ipToNode.get(remote);
          // this should never happen
          if (remoteNode == undefined) continue;
          let port = bElem[0].substring(ind+1);
          let hoverInfo = `\nLocalPort:${bElem[1][0]}, ${remoteNode.name}:${port}, `;
          if (bElem[1][1] == "-1") hoverInfo += "broken";
          else hoverInfo += `high latency (${bElem[1][1]})`
          if (infoToShow == "") infoToShow = "\n\nBad connections"
          infoToShow += hoverInfo;
        }

        let title: string = this.formTitle(elem) + infoToShow;
        this.nodes.push({ id: elem[1].id, label: " " + elem[1].name + " ", title: title, color: this.getNodeColor(elem[1]) });
      }
      let k = localMapArray.findIndex(elem => elem[0] == node.id);
      let neighborhood = [...localMapArray[k][1].leaseStates];
      for (let nElem of neighborhood)
      this.edges.push({ from: localMapArray[k][1].id, to: nElem[0] });
      this.drawGraph("neighborhood");
    }
  }

  // setting the bounds of selected time range
  public setDate(newDate: IOnDateChange) {
    this.endDate = newDate.endDate;
    //this.startDate = newDate.startDate;
    this.startDate = this.dateMin;
    if (this.noneAction !== undefined) {
      this.noneAction.nativeElement.checked = true; 
      this.noneAction.nativeElement.dispatchEvent(new Event('click'));
    }
  }

}
