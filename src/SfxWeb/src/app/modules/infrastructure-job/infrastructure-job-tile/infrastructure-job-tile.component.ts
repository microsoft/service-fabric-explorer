import { Component, Input, OnInit } from '@angular/core';
import { InfrastructureJob } from 'src/app/Models/DataModels/infrastructureJob';

@Component({
  selector: 'app-infrastructure-job-tile',
  templateUrl: './infrastructure-job-tile.component.html',
  styleUrls: ['./infrastructure-job-tile.component.scss']
})
export class InfrastructureJobTileComponent implements OnInit {

  @Input() job: InfrastructureJob;

  constructor() { }

  ngOnInit(): void {
  }

}
