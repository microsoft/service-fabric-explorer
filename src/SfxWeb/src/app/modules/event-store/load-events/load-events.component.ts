import { Component, EventEmitter, Output } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { EventType, IEventStoreData } from '../event-store/event-store.component';

@Component({
  selector: 'app-load-events',
  templateUrl: './load-events.component.html',
  styleUrls: ['./load-events.component.scss']
})
export class LoadEventsComponent {

  @Output() loadedEvents = new EventEmitter<IEventStoreData<any, any>>();
  types: EventType[] = ['Cluster', 'Node', 'Application', 'Partition', 'RepairTask'];
  constructor(public dataService: DataService, public settings: SettingsService) { }

  type: EventType;
  id: string = '';
  filterString: string = '';

  setType(event: any) {
    this.type = event.target.value;
  }

  getEvents() {

    let events: IEventStoreData<any, any>;

    const filter = this.filterString.split(',');
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
      case 'Partition':
        events = this.dataService.getPartitionEventData(this.id);
        break;
      case 'RepairTask':
        events = this.dataService.getRepairTasksData(this.settings);
        break;
    }
    events.eventsList.setEventFilter(filter);

    this.loadedEvents.emit(events);
  }
  
}
