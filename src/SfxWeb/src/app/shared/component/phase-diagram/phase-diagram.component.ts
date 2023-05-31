import { Component, Input, OnChanges, OnInit, TemplateRef } from '@angular/core';

@Component({
  selector: 'app-phase-diagram',
  templateUrl: './phase-diagram.component.html',
  styleUrls: ['./phase-diagram.component.scss']
})
export class PhaseDiagramComponent implements OnChanges {

  @Input() middleItem: TemplateRef<any>;
  @Input() items: IProgressStatus[];
  @Input() currentIndex = 0;
  @Input() vertical = false;
  @Input() failed: boolean = false; //treat in progress phases as failed
  public progress: IProgressStatusWithIndex[] = [];
  public wrapperClass = '';

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
    '-2': 'failed',
    1: 'pending'
  };

  constructor() { }

  ngOnChanges(): void {

    this.progress = this.items.map( (phase, index) => {
      return  {
        ...phase,
        name: phase.name,
        state: this.getPhaseReference(this.currentIndex, index + 1),
        textRight: phase.textRight,
      };
    });

    this.wrapperClass = this.vertical ? 'vertical' : '';
  }

  getPhaseReference(index: number, currentPhase: number) {
    const diff = currentPhase - index;
    if (diff >= 1) {
      return 1;
    }else if (diff <= -1) {
      return -1;
    }else{
      return this.failed ? -2 : 0;
    }
  }

}


export interface IProgressStatus {
  name: string;
  textRight?: string;
  tooltip?: string;
}

interface IProgressStatusWithIndex extends IProgressStatus {
  state: number;
}
