import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { ChipModalComponent } from '../chip-modal/chip-modal.component';
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

  constructor(public dataService: DataService,
              public settings: SettingsService,
              protected dialog: MatDialog) { }

  openChipModal() {
    let dialogRef = this.dialog.open(ChipModalComponent, {
      data: this.chip, panelClass: 'mat-dialog-container-wrapper'
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.chip = result;
        this.getEvents(); 
      }
    });
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
