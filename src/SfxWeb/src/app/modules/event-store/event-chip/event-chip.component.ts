import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { IEventStoreData } from '../event-store/event-store.component';

export interface IEventChipData {
  events: IEventStoreData<any, any>;
  data?: EventChip;
}

export class EventChip {

  constructor() {
    this.name = '';
    this.id = '';
    this.eventsFilter = '';
  }
  name: string;
  type: string;
  id: string;
  partitionId?: string;
  eventsFilter: string;
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
  selector: 'app-event-chip',
  templateUrl: './event-chip.component.html',
  styleUrls: ['./event-chip.component.scss']
})
export class EventChipComponent {

  @Input() chip: EventChip = new EventChip();
  @Input() addChip: boolean = false;
  @Output() onLoad = new EventEmitter<IEventChipData>();
  @Output() onRemove = new EventEmitter<string>();

  types: EventType[] = ['Cluster', 'Node', 'Application', 'Service', 'Partition', 'Replica', 'RepairTask'];
  constructor(public dataService: DataService, public settings: SettingsService) { }

  setType(event: any) {
    this.chip.type = event.target.value;
  }

  getEvents() {
    // removes whitespace
    this.chip.eventsFilter = this.chip.eventsFilter.replace(/\s+/g, '');

    let events: IEventStoreData<any, any>;

    const filter = this.chip.eventsFilter.split(',').filter(e => e);
    switch (this.chip.type) {
      case 'Cluster':
        events = this.dataService.getClusterEventData();
        break;
      case 'Application':
        events = this.dataService.getApplicationEventData(this.chip.id);
        break;
      case 'Node':
        events = this.dataService.getNodeEventData(this.chip.id);
        break;
      case 'Service':
        events = this.dataService.getServiceEventData(this.chip.id);
        break;
      case 'Partition':
        events = this.dataService.getPartitionEventData(this.chip.id);
        break;
      case 'Replica':
        events = this.dataService.getReplicaEventData(this.chip.partitionId, this.chip.id);
        break;
      case 'RepairTask':
        events = this.dataService.getRepairTasksData(this.settings);
        break;
    }
    events.eventsList.setEventFilter(filter);


    if (this.chip.eventsFilter) {
      events.displayName = `${events.displayName}-${this.chip.eventsFilter}`;
    }

    this.chip.name = events.displayName;

    if (this.addChip) {
      this.onLoad.emit({ events, data: { ...this.chip } });
      this.chip = new EventChip();
    }
    else {
      this.onLoad.emit({ events });
    }
  }
  
  removeEvent() {
    this.onRemove.emit(this.chip.name);
  }

}
