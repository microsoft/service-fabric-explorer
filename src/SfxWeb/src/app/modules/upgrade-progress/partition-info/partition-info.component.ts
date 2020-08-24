import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { IRawServiceNameInfo, IRawApplicationNameInfo, IRawPartition } from 'src/app/Models/RawDataTypes';

@Component({
  selector: 'app-partition-info',
  templateUrl: './partition-info.component.html',
  styleUrls: ['./partition-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PartitionInfoComponent {

  @Input() partitionInfo: IPartitionData;

  constructor() { }


}

export interface IPartitionData {
  serviceName: IRawServiceNameInfo;
  applicationName: IRawApplicationNameInfo;
  partition: IRawPartition
}