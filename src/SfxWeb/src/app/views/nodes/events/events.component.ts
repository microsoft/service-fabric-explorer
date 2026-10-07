import { Component, OnDestroy, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { Subscription } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
import { IEventStoreData } from 'src/app/modules/event-store/event-store/event-store.component';
import { SettingsService } from 'src/app/services/settings.service';
import { IOptionConfig } from 'src/app/modules/event-store/option-picker/option-picker.component';
import { VisReference } from 'src/app/modules/event-store/event-store/event-store.component';
import { TimelineComponent } from 'src/app/modules/event-store/timeline/timeline.component';
import { RcaVisualizationComponent } from 'src/app/modules/event-store/rca-visualization/rca-visualization.component';
import { ClusterResourceUsageVisualizationComponent } from './resource-usage-visualization.component';
import { FabricProcessResourceUsageCapabilityService } from 'src/app/services/fabric-process-resource-usage-capability.service';

const timelineVisualization: VisReference = { name: 'Timeline', component: TimelineComponent };
const resourceUsageVisualization: VisReference = {
  name: 'Fabric Resource Usage (Top Nodes)',
  component: ClusterResourceUsageVisualizationComponent
};
const rcaVisualization: VisReference = { name: 'RCA Summary', component: RcaVisualizationComponent };

@Component({
    selector: 'app-nodes-events',
    templateUrl: './events.component.html',
    styleUrls: ['./events.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class EventsComponent implements OnInit, OnDestroy {
  data = inject(DataService);
  settings = inject(SettingsService);
  private resourceUsageCapability = inject(FabricProcessResourceUsageCapabilityService);
  private capabilitySubscription?: Subscription;


  listEventStoreData!: IEventStoreData<any, any> [];
  optionsConfig!: IOptionConfig;
  vizRefs: VisReference[] = [timelineVisualization, rcaVisualization];

  ngOnInit() {
    this.listEventStoreData = [
      this.data.getNodeEventData()
    ];

    this.optionsConfig = {
      enableCluster: true,
      enableRepairTasks: true
    };

    this.capabilitySubscription = this.resourceUsageCapability.ensureSupported().subscribe({
      next: isSupported => {
        if (isSupported) {
          this.vizRefs = [timelineVisualization, resourceUsageVisualization, rcaVisualization];
        }
      },
      error: error => console.error('Failed to detect Fabric process resource usage support.', error)
    });
  }

  ngOnDestroy(): void {
    this.capabilitySubscription?.unsubscribe();
  }

}
