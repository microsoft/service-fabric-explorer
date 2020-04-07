import { Component, OnInit, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { IUnhealthyEvaluationNode } from 'src/app/Utils/healthUtils';

@Component({
  selector: 'app-unhealthy-evaluation',
  templateUrl: './unhealthy-evaluation.component.html',
  styleUrls: ['./unhealthy-evaluation.component.scss']
})
export class UnhealthyEvaluationComponent implements OnChanges {

  public CUTOFFLENGTH = 500;

  @Input() isAnchor: boolean = false;

  @Input() node: IUnhealthyEvaluationNode;

  @Input() condensed: boolean = true;
  @Input() containsErrorInPath: boolean = false;
  @Input() fullDescription: boolean = false;
  
  
  @Output() onAnchor = new EventEmitter<IUnhealthyEvaluationNode>();

  showChildren: boolean = true;

  displayText: string = "";
  
  showFullText: boolean = false;
  displayTextIsLong: boolean = false;
  constructor() { }

  ngOnChanges(): void {
    if(this.node.healthEvaluation){
      this.displayTextIsLong = this.node.healthEvaluation.description.length > this.CUTOFFLENGTH || this.fullDescription;
      this.setDisplayText();
      if(this.fullDescription) {
        this.displayTextIsLong = false;
      }
    }
  }

  toggleShow() {
    this.showChildren = !this.showChildren;
  }

  toggleShowText() {
    this.showFullText = !this.showFullText;
    this.setDisplayText();
  }

  setDisplayText() {
    this.displayText = this.showFullText || this.fullDescription? this.node.healthEvaluation.description : this.node.healthEvaluation.description.substring(0, this.CUTOFFLENGTH);
  }

  onAnchorSet(node: IUnhealthyEvaluationNode) {
    console.log(node)
    this.onAnchor.emit(node);
  }

  trackById(index: number, node: IUnhealthyEvaluationNode) {
    return node.healthEvaluation.uniqueId;
  }

}
