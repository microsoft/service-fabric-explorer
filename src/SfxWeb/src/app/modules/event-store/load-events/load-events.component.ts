import { Component, EventEmitter, Output } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { IEventStoreData } from '../event-store/event-store.component';

export interface IEventsData {
  events: IEventStoreData<any, any>;
  id: string;
}

type EventType =
  "Cluster" |
  "Node" |
  'Application' |
  'Service' |
  'Replica' |
  "Partition" |
  "RepairTask"

@Component({
  selector: 'app-load-events',
  templateUrl: './load-events.component.html',
  styleUrls: ['./load-events.component.scss']
})
export class LoadEventsComponent {

  @Output() loadedEvents = new EventEmitter<IEventsData>();
  types: EventType[] = ['Cluster', 'Node', 'Application', 'Service', 'Partition', 'Replica', 'RepairTask'];
  constructor(public dataService: DataService, public settings: SettingsService) { }

  type: EventType;
  id: string = '';
  partitionId: string = '';
  filterString: string = '';

  setType(event: any) {
    this.type = event.target.value;
  }

  getEvents() {

    // removes whitespace
    this.filterString = this.filterString.replace(/\s+/g, '');

    let events: IEventStoreData<any, any>;

    const filter = this.filterString.split(',').filter(e => e);
    switch (this.type) {
      case 'Cluster':
        events = this.dataService.getClusterEventData();
        break;
      case 'Application':
        events = this.dataService.getApplicationEventData(this.id);
        break;
      case 'Node':
        events = this.dataService.getNodeEventData(this.id);
        break;
      case 'Service':
        events = this.dataService.getServiceEventData(this.id);
        break;
      case 'Partition':
        events = this.dataService.getPartitionEventData(this.id);
        break;
      case 'Replica':
        events = this.dataService.getReplicaEventData(this.partitionId, this.id);
        break;
      case 'RepairTask':
        events = this.dataService.getRepairTasksData(this.settings);
        break;
    }
    events.eventsList.setEventFilter(filter);

    this.loadedEvents.emit({ events, id : this.id });
  }
  
}
