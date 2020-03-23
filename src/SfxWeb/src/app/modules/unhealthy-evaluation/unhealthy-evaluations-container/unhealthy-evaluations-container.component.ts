import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { HealthEvaluation } from 'src/app/Models/DataModels/Shared';

export interface IUnhealthyEvaluationNode {
  healthEvaluation: HealthEvaluation;
  children: IUnhealthyEvaluationNode[];
  totalChildCount: number;
  parent: IUnhealthyEvaluationNode;
  containsErrorInPath: boolean;
}

@Component({
  selector: 'app-unhealthy-evaluations-container',
  templateUrl: './unhealthy-evaluations-container.component.html',
  styleUrls: ['./unhealthy-evaluations-container.component.scss']
})
export class UnhealthyEvaluationsContainerComponent implements OnInit, OnChanges {
 
  @Input() healthEvaluations: HealthEvaluation[];

  rootPath: string[] = [];
  root: IUnhealthyEvaluationNode;
  originalRoot: IUnhealthyEvaluationNode= {
    totalChildCount: 0,
    healthEvaluation: null,
    children: [],
    parent: null,
    containsErrorInPath: false
  };
  parentPath: IUnhealthyEvaluationNode[] = [];

  usingOriginalRoot: boolean = true; 
  hiddenNodes: number = 0;


  condensed: boolean = true;
  errorOnly: boolean = false;
  fullDescriptions: boolean = false;
  constructor() { }

  ngOnChanges(): void {
    let roots = [];
    let childCount = 0;
    this.healthEvaluations.filter(node => node.parent === null).forEach(root => {
      const newNode = recursivelyBuildTree(root, this.originalRoot);
      roots.push(newNode);
      childCount += newNode.totalChildCount;
    })

    this.originalRoot.totalChildCount = childCount,
    this.originalRoot.children = roots;

    
    const updatedNode = this.getNestedNode(this.rootPath, this.originalRoot);
    if(updatedNode) {
      this.setNewRootNode(updatedNode);
    }else{
      this.setNewRootNode(this.originalRoot);
    }
    console.log(this.root)
  }

  getNestedNode(path: string[], root: IUnhealthyEvaluationNode) {
    if(path.length >= 1) {
      const id = path.shift();
      const pathNode = root.children.find(node => node.healthEvaluation.uniqueId === id);
      if(pathNode) {

        if(path.length === 0) {
          return pathNode
        }else{
          return this.getNestedNode(path, pathNode);
        }
      }else{
        return null;
      }

    }else if(path.length === 0 ) {
      return root;
    }
  }

  ngOnInit(): void {
    this.root = this.originalRoot;
  }

  setfullDescriptions() {
    this.fullDescriptions = !this.fullDescriptions;
  }

  setErrorOnlyStatus() {
    this.errorOnly = !this.errorOnly;
  }

  setCondenseStatus() {
    this.condensed = !this.condensed;
  }

  setNewRootNode(node: IUnhealthyEvaluationNode) {
    console.log(node);
    this.root = node;
    this.parentPath = this.getParentPath(node);
    this.rootPath = this.parentPath.slice(1).map(node => node.healthEvaluation.uniqueId);
    this.usingOriginalRoot = node === this.originalRoot;
    if(!this.usingOriginalRoot) {
      this.rootPath.push(this.root.healthEvaluation.uniqueId)
    }
    // let skipDepth = 3;
    // this.root.children = skipTreeDepthParentNode(this.root, skipDepth)
    console.log(this.rootPath)
    if(!this.usingOriginalRoot) {
      this.hiddenNodes = this.originalRoot.totalChildCount - this.root.totalChildCount;
    }
  
  }
  
  getParentPath(node: IUnhealthyEvaluationNode): IUnhealthyEvaluationNode[] {
    let parents = [];
    
    let nodeRef = node;
    while(nodeRef.parent !== null) {
      parents.push(nodeRef.parent);
      nodeRef = nodeRef.parent;
    }
    console.log(parents)
    return parents.reverse();
  }

  resetAnchor() {
    this.setNewRootNode(this.originalRoot);
  }

  goBackOneLevel() {
    this.setNewRootNode(this.root.parent);
  }

  getEvents() {
    const children = getLeafNodes(this.root);
    console.log(children)
    let newRoot: IUnhealthyEvaluationNode = {
      totalChildCount: children.length,
      healthEvaluation: null,
      children,
      parent: null,
      containsErrorInPath: false
    }
    this.setNewRootNode(newRoot)
  }
 
}

const getLeafNodes = (root: IUnhealthyEvaluationNode): IUnhealthyEvaluationNode[] => {
  if(root.children.length == 0) {
    return [root];
  }else{
    let nodes = [];
    root.children.forEach( node => { nodes = nodes.concat(getLeafNodes(node))});
    return nodes;
  }
}

const skipTreeDepthParentNode = (root: IUnhealthyEvaluationNode, depth: number = 1): IUnhealthyEvaluationNode[] => {
  if(depth <= 0) {
    console.log("test")
    return [root];
  }else{
    let nodes = [];
    root.children.forEach( node => { nodes = nodes.concat(skipTreeDepthParentNode(node, depth - 1))});
    console.log(nodes)
    return nodes;
  }
}

const recursivelyBuildTree = (healthEvaluation: HealthEvaluation, parent: IUnhealthyEvaluationNode = null): IUnhealthyEvaluationNode => {
  let curretNode: any = {};
  const children = [];
  let  totalChildCount = 1;
  let containsErrorInPath = healthEvaluation.healthState.text === "Error";
  healthEvaluation.children.forEach(child => {
    const newNode = recursivelyBuildTree(child, curretNode);
    totalChildCount += newNode.totalChildCount;
    children.push(newNode)
    if(newNode.containsErrorInPath) {
      containsErrorInPath = true;
    }
  })

  Object.assign(curretNode, <IUnhealthyEvaluationNode>{
    healthEvaluation,
    children,
    totalChildCount,
    parent,
    containsErrorInPath
  })
  return curretNode
}
