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

    const clusterChip = new EventChip();
    clusterChip.type = 'Cluster';

    const nodeChip = new EventChip();
    nodeChip.type = 'Node';

    this.listEventStoreChip = [clusterChip, nodeChip];
      
    this.data.clusterManifest.ensureInitialized().subscribe(() => {
      if (this.data.clusterManifest.isRepairManagerEnabled) {
        this.data.repairCollection.ensureInitialized().subscribe(() => {
          const repairChip = new EventChip();
          repairChip.type = 'RepairTask';
          this.listEventStoreChip = this.listEventStoreChip.concat([repairChip]);
        });
      }
    });

  }

}
