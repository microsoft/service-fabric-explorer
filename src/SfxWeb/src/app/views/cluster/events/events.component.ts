import { Component, OnInit } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { IEventStoreData } from 'src/app/modules/event-store/event-store/event-store.component';
import { SettingsService } from 'src/app/services/settings.service';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent implements OnInit {

  listEventStoreData: IEventStoreData<any, any> [];

  constructor(public data: DataService, private settings: SettingsService) { }

  ngOnInit() {
    this.listEventStoreData = [
      this.data.getClusterEventData(),
      this.data.getRepairTasksData(this.settings)
    ];
  }

}
