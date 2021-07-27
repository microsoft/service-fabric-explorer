import { Component, Input, ChangeDetectionStrategy, OnChanges } from '@angular/core';
import { IRawServiceNameInfo, IRawApplicationNameInfo, IRawPartition } from 'src/app/Models/RawDataTypes';
import { RoutesService } from 'src/app/services/routes.service';
import { DataService } from 'src/app/services/data.service';
import { IEssentialListItem } from '../../charts/essential-health-tile/essential-health-tile.component';

@Component({
  selector: 'app-partition-info',
  templateUrl: './partition-info.component.html',
  styleUrls: ['./partition-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PartitionInfoComponent implements OnChanges {

  @Input() partitionInfo: IPartitionData;

  essentialItems: IEssentialListItem[] = [];

  constructor(private dataService: DataService,
              private routeService: RoutesService) {}

  view() {
    console.log(this.partitionInfo);
    if (this.partitionInfo.applicationName.Name === 'fabric:/System') {
      this.dataService.getSystemApp().subscribe(app => {
        const routeLocation = () => RoutesService.getPartitionViewPath(app.raw.TypeName, this.partitionInfo.applicationName.Id,
          this.partitionInfo.serviceName.Id, this.partitionInfo.partition.PartitionInformation.Id);
        this.routeService.navigate(routeLocation);
      });
    }else {
      this.dataService.getApp(this.partitionInfo.applicationName.Id).subscribe(app => {
        const routeLocation = () => RoutesService.getPartitionViewPath(app.raw.TypeName, this.partitionInfo.applicationName.Id,
          this.partitionInfo.serviceName.Id, this.partitionInfo.partition.PartitionInformation.Id);
        this.routeService.navigate(routeLocation);
      });
    }
  }


  ngOnChanges() {
    this.essentialItems = [
      {
        descriptionName: 'Minimum Replica Set Size',
        copyTextValue: this.partitionInfo.partition.MinReplicaSetSize.toString(),
        displayText: this.partitionInfo.partition.MinReplicaSetSize.toString(),
      },
      {
        descriptionName: 'Target Replica Set Size',
        copyTextValue: this.partitionInfo.partition.TargetReplicaSetSize.toString(),
        displayText: this.partitionInfo.partition.TargetReplicaSetSize.toString(),
      },
      {
        descriptionName: 'Application name',
        copyTextValue: this.partitionInfo.applicationName.Id,
        displayText: this.partitionInfo.applicationName.Id,
      },
      {
        descriptionName: 'Service name',
        copyTextValue: this.partitionInfo.serviceName.Id,
        displayText: this.partitionInfo.serviceName.Id,
      },
    ]
  }
}

export interface IPartitionData {
  serviceName: IRawServiceNameInfo;
  applicationName: IRawApplicationNameInfo;
  partition: IRawPartition;
}
