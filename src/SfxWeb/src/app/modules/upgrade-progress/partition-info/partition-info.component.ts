import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { IRawServiceNameInfo, IRawApplicationNameInfo, IRawPartition } from 'src/app/Models/RawDataTypes';
import { RoutesService } from 'src/app/services/routes.service';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-partition-info',
  templateUrl: './partition-info.component.html',
  styleUrls: ['./partition-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PartitionInfoComponent {

  @Input() partitionInfo: IPartitionData;

  constructor(private dataService: DataService,
              private routeService: RoutesService) {}

  view() {
    this.dataService.getApp(this.partitionInfo.applicationName.Id).subscribe(app => {
      const routeLocation = () => RoutesService.getPartitionViewPath(app.raw.TypeName, this.partitionInfo.applicationName.Id, this.partitionInfo.serviceName.Id, this.partitionInfo.partition.PartitionInformation.Id);
      this.routeService.navigate(routeLocation);
    });
  }
}

export interface IPartitionData {
  serviceName: IRawServiceNameInfo;
  applicationName: IRawApplicationNameInfo;
  partition: IRawPartition
}