import { Component, OnInit, Input, OnChanges, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { IUnhealthyEvaluationNode } from 'src/app/Utils/healthUtils';

@Component({
  selector: 'app-unhealthy-evaluation',
  templateUrl: './unhealthy-evaluation.component.html',
  styleUrls: ['./unhealthy-evaluation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnhealthyEvaluationComponent implements OnChanges, OnInit, AfterViewInit {

  @Input() isAnchor: boolean = false;

  @Input() node: IUnhealthyEvaluationNode;

  @Input() condensed: boolean = true;
  @Input() containsErrorInPath: boolean = false;
  @Input() fullDescription: boolean = false;
  
  
  @Output() onAnchor = new EventEmitter<IUnhealthyEvaluationNode>();

  showChildren: boolean = true;
  
  showFullText: boolean = false;
  displayTextIsLong: boolean = false;

  @ViewChild("tref", {read: ElementRef}) tref: ElementRef;

  constructor(private cdr: ChangeDetectorRef) { }
  ngAfterViewInit(): void {
    if(this.tref) {
      this.displayTextIsLong = this.tref.nativeElement.clientHeight > 60;
      this.cdr.detectChanges()
    }
  }

  ngOnInit(): void {
    if(this.tref) {
      this.displayTextIsLong = this.tref.nativeElement.clientHeight > 60;
    }
  }

  ngOnChanges(): void {
      if(this.tref) {
        this.displayTextIsLong = this.tref.nativeElement.clientHeight > 60;
      }
  }

  toggleShow() {
    this.showChildren = !this.showChildren;
  }

  toggleShowText() {
    this.showFullText = !this.showFullText;
    this.cdr.detectChanges();
    console.log(this.fullDescription || (this.displayTextIsLong && this.showFullText))
    console.log(this)
  }

  onAnchorSet(node: IUnhealthyEvaluationNode) {
    console.log(node)
    this.onAnchor.emit(node);
  }

  trackById(index: number, node: IUnhealthyEvaluationNode) {
    return node.healthEvaluation.uniqueId;
  }

}
