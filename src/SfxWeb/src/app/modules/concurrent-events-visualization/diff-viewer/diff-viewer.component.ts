import { Component, Input, OnInit } from '@angular/core';
import { IAnalysisResultDiff } from 'src/app/Models/eventstore/rcaEngineConfigurations';

@Component({
  selector: 'app-diff-viewer',
  templateUrl: './diff-viewer.component.html',
  styleUrls: ['./diff-viewer.component.scss']
})
export class DiffViewerComponent implements OnInit {

  @Input() diffResult: IAnalysisResultDiff;

  constructor() { }

  ngOnInit(): void {

  }

}
