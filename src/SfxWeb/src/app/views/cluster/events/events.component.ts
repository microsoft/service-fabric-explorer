import { Component, OnInit } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { EventChip } from 'src/app/modules/event-store/event-chip/event-chip.component';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent implements OnInit {

  listEventStoreChip: EventChip[] = [];

  constructor(public data: DataService) { }

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

  }

}
