import { Component, OnInit, Input } from '@angular/core';
import { IRawReplicatorStatus } from 'src/app/Models/RawDataTypes';

@Component({
  selector: 'app-replica-status-container',
  templateUrl: './replica-status-container.component.html',
  styleUrls: ['./replica-status-container.component.scss']
})
export class ReplicaStatusContainerComponent implements OnInit {

  @Input() replicatorData: IRawReplicatorStatus;

  constructor() { }

  ngOnInit(): void {
  }

}
