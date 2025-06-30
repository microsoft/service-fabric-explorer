import { Component, Injector, OnInit } from '@angular/core';
import { ServiceBaseControllerDirective } from '../ServiceBase';
import { DataService } from 'src/app/services/data.service';
import { IResourceItem } from 'src/app/modules/charts/resources-tile/resources-tile.component';
import { RGMetric } from 'src/app/Models/DataModels/Application';
import { NodeLoadInformation } from 'src/app/Models/DataModels/Node';

@Component({
  selector: 'app-resources',
  templateUrl: './resources.component.html',
  styleUrls: ['./resources.component.scss']
})
export class ResourcesComponent extends ServiceBaseControllerDirective {

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  cpuData: IResourceItem[] = [];
  memoryData: IResourceItem[] = [];
  dynamicMetric: RGMetric = RGMetric.CPU;

  nodeLoad: NodeLoadInformation[] = [];

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
        title: "Dynamic load reporting",
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
        title: "Dynamic load reporting",
        boolValue: this.dynamicMetric == RGMetric.Memory,
        selectorName: "dynamic",
        displaySelector: true
      }
    ]
  }
}
