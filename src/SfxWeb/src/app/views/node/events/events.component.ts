import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { NodeBaseControllerDirective } from '../NodeBase';
import { IEventStoreData } from 'src/app/modules/event-store/event-store/event-store.component';
import { VisReference } from 'src/app/modules/event-store/event-store/event-store.component';
import { IOptionConfig } from 'src/app/modules/event-store/option-picker/option-picker.component';
import { TimelineComponent } from 'src/app/modules/event-store/timeline/timeline.component';
import { RcaVisualizationComponent } from 'src/app/modules/event-store/rca-visualization/rca-visualization.component';
import { ResourceUsageVisualizationComponent } from './resource-usage-visualization.component';
import { FabricProcessResourceUsageCapabilityService } from 'src/app/services/fabric-process-resource-usage-capability.service';

const timelineVisualization: VisReference = { name: 'Timeline', component: TimelineComponent };
const resourceUsageVisualization: VisReference = {
  name: 'Fabric.exe Resource Usage',
  component: ResourceUsageVisualizationComponent
};
const rcaVisualization: VisReference = { name: 'RCA Summary', component: RcaVisualizationComponent };

@Component({
    selector: 'app-node-events',
    templateUrl: './events.component.html',
    styleUrls: ['./events.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class EventsComponent extends NodeBaseControllerDirective {
  protected data: DataService = inject(DataService);
  private resourceUsageCapability = inject(FabricProcessResourceUsageCapabilityService);


  listEventStoreData!: IEventStoreData<any, any> [];
  optionsConfig!: IOptionConfig;
  vizRefs: VisReference[] = [timelineVisualization, rcaVisualization];

  setup() {
    this.vizRefs = [timelineVisualization, rcaVisualization];
    this.listEventStoreData = [
      this.data.getNodeEventData(this.nodeName)
    ];

    this.optionsConfig = {
      enableCluster: true,
      enableRepairTasks: true
    };

    this.subscriptions.add(this.resourceUsageCapability.ensureSupported().subscribe(isSupported => {
      if (isSupported) {
        this.vizRefs = [timelineVisualization, resourceUsageVisualization, rcaVisualization];
      }
    }));
  }

}
