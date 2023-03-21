import { Component, Injector, OnInit } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { IEventStoreData, VisReference } from 'src/app/modules/event-store/event-store/event-store.component';
import { IOptionConfig } from 'src/app/modules/event-store/option-picker/option-picker.component';
import { Service } from 'src/app/Models/DataModels/Service';
import { TimelineComponent } from 'src/app/modules/event-store/timeline/timeline.component';
import { NamingViewerComponent } from '../naming-viewer/naming-viewer.component';
import { mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-naming-viewer-page',
  templateUrl: './naming-viewer-page.component.html',
  styleUrls: ['./naming-viewer-page.component.scss']
})
export class NamingViewerPageComponent implements OnInit {

  listEventStoreData: IEventStoreData<any, any> [] = [];

  optionsConfig: IOptionConfig = {
    enableCluster: true,
    enableNodes: true,
    enableRepairTasks: true
  };

  public namingService: Service;

  public vizRefs: VisReference[] = [
    { name: "Timeline", component: TimelineComponent },
    { name: "Metrics", component: NamingViewerComponent}
  ]

  constructor(protected data: DataService) {
  }
  ngOnInit(): void {
    this.data.getService("System", "System/NamingService").pipe(mergeMap(app => {
      this.namingService = app;
      return app.partitions.ensureInitialized()
      })).subscribe(() => {
        this.listEventStoreData = this.namingService.partitions.collection.map(partition => this.data.getReplicaEventData(partition.id));
      })
  }
}
