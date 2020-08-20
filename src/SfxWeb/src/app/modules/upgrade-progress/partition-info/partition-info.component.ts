import { Component, OnInit, Input } from '@angular/core';
import { IRawServiceNameInfo, IRawApplicationNameInfo, IRawPartition } from 'src/app/Models/RawDataTypes';

@Component({
  selector: 'app-partition-info',
  templateUrl: './partition-info.component.html',
  styleUrls: ['./partition-info.component.scss']
})
export class PartitionInfoComponent implements OnInit {

  @Input() partitionInfo: IPartitionData;

  constructor() { }

  ngOnInit(): void {
  }

}

export interface IPartitionData {
  serviceName: IRawServiceNameInfo;
  applicationName: IRawApplicationNameInfo;
  partition: IRawPartition
}