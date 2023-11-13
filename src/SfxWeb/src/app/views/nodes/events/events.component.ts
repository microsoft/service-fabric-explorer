import { Component, OnInit } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { IEventStoreData } from 'src/app/modules/event-store/event-store/event-store.component';
import { SettingsService } from 'src/app/services/settings.service';
import { IOptionConfig } from 'src/app/modules/event-store/option-picker/option-picker.component';

@Component({
  selector: 'app-nodes-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent implements OnInit {

  listEventStoreData: IEventStoreData<any, any> [];
  optionsConfig: IOptionConfig;

  constructor(public data: DataService, public settings: SettingsService) { }

  ngOnInit() {
    this.listEventStoreData = [
      this.data.getNodeEventData()
    ];

    this.optionsConfig = {
      enableCluster: true,
      enableRepairTasks: true
    };
  }

}
