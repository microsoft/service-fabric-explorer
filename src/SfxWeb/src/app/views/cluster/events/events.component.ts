import { Component, OnInit } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { IEventStoreData } from 'src/app/modules/event-store/event-store/event-store.component';
import { IOptionConfig } from 'src/app/modules/event-store/option-picker/option-picker.component';
import { SettingsService } from 'src/app/services/settings.service';

@Component({
  selector: 'app-cluster-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent implements OnInit {

  listEventStoreData: IEventStoreData<any, any> [];
  optionsConfig: IOptionConfig;

  constructor(public data: DataService, private settings: SettingsService) { }

  ngOnInit() {
    this.listEventStoreData = [
      this.data.getClusterEventData(),
      this.data.getNodeEventData()
    ];

    this.data.clusterManifest.ensureInitialized().subscribe(() => {
      if (this.data.clusterManifest.isRepairManagerEnabled) {
        this.data.repairCollection.ensureInitialized().subscribe(() => {
          this.listEventStoreData = this.listEventStoreData.concat([this.data.getRepairTasksData(this.settings)]);
        });
      }
    });

    this.optionsConfig = {
      enableNodes: true,
      enableRepairTasks: true
    };
  }

}
