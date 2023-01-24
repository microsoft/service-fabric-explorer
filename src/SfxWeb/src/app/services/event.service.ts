import { Injectable } from '@angular/core';
import { IEventStoreData } from '../modules/event-store/event-store/event-store.component';
import { DataService } from './data.service';
import { SettingsService } from './settings.service';

interface IGetEventParameters {
  type: string,
  eventsFilter: string  
  id?: string,
  partitionId?: string,
}

@Injectable({
  providedIn: 'root'
})
export class EventService {

  constructor(public dataService: DataService, public settings: SettingsService) { }

  getEvents(param: IGetEventParameters): IEventStoreData<any, any> {
    // removes whitespace
    param.eventsFilter = param.eventsFilter.replace(/\s+/g, '');

    let events: IEventStoreData<any, any>;

    const filter = param.eventsFilter.split(',').filter(e => e);
    switch (param.type) {
      case 'Cluster':
        events = this.dataService.getClusterEventData();
        break;
      case 'Application':
        events = this.dataService.getApplicationEventData(param.id);
        break;
      case 'Node':
        events = this.dataService.getNodeEventData(param.id);
        break;
      case 'Service':
        events = this.dataService.getServiceEventData(param.id);
        break;
      case 'Partition':
        events = this.dataService.getPartitionEventData(param.id);
        break;
      case 'Replica':
        events = this.dataService.getReplicaEventData(param.partitionId, param.id);
        break;
      case 'RepairTask':
        events = this.dataService.getRepairTasksData(this.settings);
        break;
    }
    
    if (param.type !== 'RepairTask') {
      events.eventsList.setEventFilter(filter);
    }

    if (param.eventsFilter.length) {
      events.displayName = `${events.displayName}-${param.eventsFilter}`;
    }

    return events;
  }
}
