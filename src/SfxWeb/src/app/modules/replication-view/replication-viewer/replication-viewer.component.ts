import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { IProgressStatus } from 'src/app/shared/component/phase-diagram/phase-diagram.component';

@Component({
  selector: 'app-replication-viewer',
  templateUrl: './replication-viewer.component.html',
  styleUrls: ['./replication-viewer.component.scss']
})
export class ReplicationViewerComponent implements OnChanges {
  // @Input() failed = false;
  // @Input() node: IRawNodeUpgradeProgress;
  public index = 1;
  public progress: IProgressStatus[] = [
    {
      name: 'Copy Context',
    },
    {
      name: 'Copy State',
    },
    {
      name: 'Copy',
    },
    {
      name: 'Catch up',
    }
  ];

  currentSubPhase = 1;

  currentSubPhasephase = 0;
  public subPhases: Record<number, IProgressStatus[]> = {
    0: [
      {
        name: 'build context'
      },
      {
        name: 'get copy context'
      }
    ],
    1: [
      {
        name: 'build context'
      },
      {
        name: 'get copy context'
      }
    ],
    2: [
      {
        name: '2build context'
      },
      {
        name: '2get copy context'
      }
    ],
  };



  constructor() { }

  phaseClicked(index: number) {
    console.log(index)
    this.currentSubPhase = index;
  }

  ngOnChanges(): void {
    // const phaseMap = {
    //   PreUpgradeSafetyCheck: 1,
    //   Upgrading: 2,
    //   PostUpgradeSafetyCheck: 3
    // };

    // this.index = phaseMap[this.node.UpgradePhase];

    // // given the upgrading and post upgrade safety check phases refer to completed state
    // // set the index 1 further to consider them completed effectively
    // if (this.index > 1 && !this.failed) {
    //   this.index ++;
    // }

    this.progress = [
      {
        name: 'Copy Context',
      },
      {
        name: 'Copy State',
      },
      {
        name: 'Copy',
      },
      {
        name: 'Catch up',
      }
    ];
  }
}
