import { Component, OnInit, Injector, Input, NgModule } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable, forkJoin, of } from 'rxjs';
import { ServiceBaseControllerDirective } from '../ServiceBase';
import { map } from 'rxjs/operators';

import * as _ from 'lodash'




@Component({
  selector: 'app-placement',
  templateUrl: './placement.component.html',
  styleUrls: ['./placement.component.scss']
})
export class PlacementComponent extends ServiceBaseControllerDirective {

  placementConstraints:string;
  nodesProperty:any[];
  goodConstraintResults:any[];
  badConstraintResults: any[];
  original_constraintResults:any[]; // used for sorting and searching to reset constraintResults
  oldBlockedNodes:any[];

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);    
  }

  private  getNodesProperty() {
    const parser = new DOMParser();
    const xml = parser.parseFromString(this.service.parent.manifest.data.clusterManifest.raw.Manifest, 'text/xml');
    const manifest = xml.getElementsByTagName('ClusterManifest')[0];
    /*
      Node Type Name : {
        properties : values
      }
    */
    
    let nodes = [] // final version of node
    let node_types = {}
    let XMLnode_types = manifest.getElementsByTagName("NodeTypes")[0].getElementsByTagName("NodeType")
    
    for(let node_index = 0; node_index < XMLnode_types.length; ++node_index) {
        const XMLnode = XMLnode_types[node_index]            
        const node_type =  XMLnode.getAttribute("Name")
        const placement_properties = XMLnode.getElementsByTagName("PlacementProperties")
        let key_properties = {}
        for(let i = 0;i < placement_properties.length; ++i) {
            const properties = placement_properties[i].getElementsByTagName("Property")
            
            for (let j = 0; j < properties.length; j++) {           
                key_properties[ properties[j].getAttribute("Name") ] = properties[j].getAttribute("Value")
              }
            } 
        node_types[node_type] = key_properties;
    }
    this.data.nodes.collection.forEach(element => {
      const property = node_types[element.raw.Type];
      nodes.push({
        property,
        'name' : element.raw.Name,
      })
    });
    return nodes;
  }

  private detectChange(newPlacementConstraints:string,newNodesProperty, newBlockedNodes) : boolean {
    if (!this.placementConstraints || !this.nodesProperty || !this.oldBlockedNodes) return true;
    if (this.placementConstraints != newPlacementConstraints) return true;
    // check nodes property
    let n1 = this.nodesProperty.length;
    let n2 = newNodesProperty.length;
    if (n1 !== n2) return true;
    for(let i=0; i < n1 ;++i) {
      if (!(_.isEqual(this.nodesProperty[i],newNodesProperty[i]))) return true;
    }
    // check blocked nodes
    n1 = this.oldBlockedNodes.length;
    n2 = newBlockedNodes.length;
    if (n1 !== n2) return true;
    for(let i=0; i < n1 ;++i) {
      if (!(_.isEqual(this.oldBlockedNodes[i],newBlockedNodes[i]))) return true;
    }
    return false;
  }

  refresh(messageHandler?: IResponseMessageHandler)
  : Observable<any>
  {
    
    let newPlacementConstraints = this.service.description.raw.PlacementConstraints;
    let newNodesProperty = this.getNodesProperty();
    let newBlockedNodes = this.service.serviceBlockList.raw.Items;
    if (this.detectChange(newPlacementConstraints, newNodesProperty, newBlockedNodes)) {
      this.oldBlockedNodes = newBlockedNodes
      let blockedNodesSet = new Set(this.oldBlockedNodes.map(item => item.NodeName));
      this.placementConstraints = newPlacementConstraints;
      this.nodesProperty = newNodesProperty;
      this.goodConstraintResults = [];
      this.badConstraintResults = [];
      
      this.nodesProperty.forEach((node,index) => {
        if (blockedNodesSet.has(node.name)) {
          this.badConstraintResults.push({
            name : node.name,
            result : false,
            index : index,
            fails : [""]
            });
        }
        else this.goodConstraintResults.push({
          name : node.name,
          result : true,
          index : index,
          fails : [""]
        })
        });
      }
      if (!this.placementConstraints) {
        // redirect if placement is not setup
        let url_array = this.router.url.split('/');
        url_array.pop(); // delete /placement part in url
        this.router.navigateByUrl(url_array.join('/'))
        return forkJoin([]);
      }
      return forkJoin([]);
    }
  }
