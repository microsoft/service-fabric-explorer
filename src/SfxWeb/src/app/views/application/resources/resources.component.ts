import { Component, Injector } from '@angular/core';
import { ApplicationBaseControllerDirective } from '../applicationBase';
import { DataService } from 'src/app/services/data.service';
import { RGMetric } from 'src/app/Models/DataModels/Application';
import { IResourceItem } from 'src/app/modules/charts/resources-tile/resources-tile.component';

@Component({
  selector: 'app-resources',
  templateUrl: './resources.component.html',
  styleUrls: ['./resources.component.scss']
})
export class ResourcesComponent extends ApplicationBaseControllerDirective {

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  cpuData: IResourceItem[] = [];
  memoryData: IResourceItem[] = [];
  dynamicMetric: RGMetric = RGMetric.CPU;

  dynamicMetricByNode: Map<number, number> = new Map<number, number>();

  setup() {

    this.cpuData = [
      {
          title: "Requested",
          displayText: "12%",
          selectorName: "requested"
      },
      {
          title: "Limit",
          displayText: "18%",
          selectorName: "limit"
      },
      {
        title: "Dynamic reporting",
        boolValue: this.dynamicMetric == RGMetric.CPU,
        selectorName: "dynamic",
        displaySelector: true
      }
    ];
    
    this.memoryData = [
      {
          title: "Requested",
          displayText: "78 MB",
          selectorName: "requested"
      },
      {
          title: "Limit",
          displayText: "100 MB",
          selectorName: "limit"
      },
      {
        title: "Dynamic reporting",
        boolValue: this.dynamicMetric == RGMetric.Memory,
        selectorName: "dynamic",
        displaySelector: true
      }
    ]
  }
}
