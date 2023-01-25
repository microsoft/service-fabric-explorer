import { Component, OnInit } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { IEventStoreData } from 'src/app/modules/event-store/event-store/event-store.component';
import { IOptionConfig } from 'src/app/modules/event-store/option-picker/option-picker.component';
import { SettingsService } from 'src/app/services/settings.service';
import { EventChip, IEventChipData } from 'src/app/modules/event-store/event-chip/event-chip.component';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent implements OnInit {

  // listEventStoreData: IEventStoreData<any, any>[];
  listEventStoreChip: EventChip[] = [];
  optionsConfig: IOptionConfig;

  constructor(public data: DataService, private settings: SettingsService) { }

  ngOnInit() {

    this.listEventStoreChip = [
      {
          name: '',
          type: 'Cluster',
          id: '',
          eventsFilter: '' 
      },
      {
          name: '',
          type: 'Node',
          id: '',
          eventsFilter: ''
        
      }
    ];
      
    this.data.clusterManifest.ensureInitialized().subscribe(() => {
      if (this.data.clusterManifest.isRepairManagerEnabled) {
        this.data.repairCollection.ensureInitialized().subscribe(() => {
          this.listEventStoreChip = this.listEventStoreChip.concat(
            [{
                name: '',
                type: 'RepairTask',
                id: '',
                eventsFilter: ''
              
            }]
          );
        });
      }
    });

    this.optionsConfig = {
      enableNodes: true,
      enableRepairTasks: true
    };
  }

}
