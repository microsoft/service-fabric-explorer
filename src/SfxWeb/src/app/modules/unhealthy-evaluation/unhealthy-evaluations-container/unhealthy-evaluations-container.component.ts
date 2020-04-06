import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { HealthEvaluation } from 'src/app/Models/DataModels/Shared';
import { IUnhealthyEvaluationNode, recursivelyBuildTree, getNestedNode, getParentPath, getLeafNodes } from 'src/app/Utils/healthUtils';

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
    containsErrorInPath: false,
    displayNames: [],
    id: "tree"
  };
  parentPath: IUnhealthyEvaluationNode[] = [];

  usingOriginalRoot: boolean = true; 
  hiddenNodes: number = 0;

  view: string = "";

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

    
    const updatedNode = getNestedNode(this.rootPath, this.originalRoot);
    if(updatedNode) {
      this.setNewRootNode(updatedNode);
    }else{
      this.setNewRootNode(this.originalRoot);
    }
    console.log(this.root)
  }

  ngOnInit(): void {
    this.root = this.originalRoot;
  }

  updateTree() {
    switch (this.view) {
      case 'Verbose':
        this.condensed = false;
        break;
      case 'Quiet':
        this.condensed = false;
        break;
      case 'Condensed':
        // this.
        break;
      case 'Events':
        this.getEvents();
        break;        
      default:
        break;
    }
    console.log(this.view);
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
    this.parentPath = getParentPath(node);
    this.rootPath = this.parentPath.slice(1).map(node => node.id);
    this.usingOriginalRoot = node === this.originalRoot;
    if(!this.usingOriginalRoot) {
      this.rootPath.push(this.root.id)
    }
    
    console.log(this.rootPath)
    if(!this.usingOriginalRoot) {
      this.hiddenNodes = this.originalRoot.totalChildCount - this.root.totalChildCount;
    }
  
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
      containsErrorInPath: false,
      displayNames: [],
      id: "all events"
    }
    this.setNewRootNode(newRoot)
  }
}
