import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { IEventStoreData } from 'src/app/modules/event-store/event-store/event-store.component';
import { SettingsService } from 'src/app/services/settings.service';
import { IOptionConfig } from 'src/app/modules/event-store/option-picker/option-picker.component';

@Component({
    selector: 'app-nodes-events',
    templateUrl: './events.component.html',
    styleUrls: ['./events.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class EventsComponent implements OnInit {
  data = inject(DataService);
  settings = inject(SettingsService);


  listEventStoreData: IEventStoreData<any, any> [];
  optionsConfig: IOptionConfig;

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
