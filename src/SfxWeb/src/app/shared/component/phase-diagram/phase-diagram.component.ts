import { Component, Input, OnChanges, OnInit } from '@angular/core';

@Component({
  selector: 'app-phase-diagram',
  templateUrl: './phase-diagram.component.html',
  styleUrls: ['./phase-diagram.component.scss']
})
export class PhaseDiagramComponent implements OnChanges {

  @Input() items: IProgressStatus[];
  @Input() currentIndex: number = 0;
  @Input() vertical = true  ;

  public progress: IProgressStatusWithIndex[] = [];
  public wrapperClass = "";

  // The following maps use
  // -1 - done
  // 0 - inprogress
  // 1 - not started
  public iconMap = {
    '-1': 'mif-checkmark',
    0: 'mif-spinner4 rotate',
  };

  public cssClass = {
    '-1': 'done',
    0: 'in-progress',
    1: 'pending'
  };

  constructor() { }

  ngOnChanges(): void {

    this.progress = this.items.map( (phase, index) => {
      return  {
        name: phase.name,
        state: this.getPhaseReference(this.currentIndex, index + 1)
      }
    })

    this.wrapperClass = this.vertical ? 'vertical' : '';
  }

  getPhaseReference(index: number, currentPhase: number) {
    const diff = currentPhase - index;
    if (diff >= 1) {
      return 1;
    }else if (diff <= -1) {
      return -1;
    }else{
      return 0;
    }
  }

}


export interface IProgressStatus {
  name: string;
}

interface IProgressStatusWithIndex extends IProgressStatus {
  state: number;
}
