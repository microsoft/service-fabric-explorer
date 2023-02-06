import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { ChipModalComponent } from '../chip-modal/chip-modal.component';
import { IEventStoreData } from '../event-store/event-store.component';
import { v4 as uuidv4 } from 'uuid';

export interface IEventChipData {
  events: IEventStoreData<any, any>;
  chip?: EventChip;
}

export class EventChip {

  constructor(chip?: EventChip) {
    this.name = chip?.name || '';
    this.id = chip?.id || '';
    this.eventsFilter = chip?.eventsFilter || '';
    this.type = chip?.type || '';
    this.partitionId = chip?.partitionId || null;
    this.dupNum = chip?.dupNum || 0;
    this.guid = chip?.guid || uuidv4();
  }

  name: string;
  type: string;
  id: string;
  partitionId?: string;
  eventsFilter: string;
  guid: string;
  
  dupNum: number; //used for displaying purpose; to distinguish between chips with same id/type
  get displayName() {
    if (this.dupNum) {
      return `${this.name}-${this.dupNum}`;
    }
    else {
      return this.name;
    }
  }
}

@Component({
  selector: 'app-event-chip',
  templateUrl: './event-chip.component.html',
  styleUrls: ['./event-chip.component.scss']
})
export class EventChipComponent {

  @Input() chip: EventChip = new EventChip();
  @Input() addChip: boolean = false;
  @Output() loadEvent = new EventEmitter<EventChip>();
  @Output() removeEvent = new EventEmitter<string>();

  constructor(public dataService: DataService,
              public settings: SettingsService,
              protected dialog: MatDialog) { }

  openChipModal() {
    let dialogRef = this.dialog.open(ChipModalComponent, {
      data: this.chip, panelClass: ['mat-dialog-container-wrapper', 'mat-dialog-visible-overflow']
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result instanceof EventChip) {
        this.chip = result;
        this.loadEvent.emit(this.chip); 
        if (this.addChip) {
          this.chip = new EventChip();
        }
      }
      else if (result) {
        this.removeEvents();
      }
    });
  }
  
  removeEvents() {
    this.removeEvent.emit(this.chip.guid);
  }

  displayFilterCount() {
    const filter = this.chip.eventsFilter.split(',').filter(e => e);
    if (filter.length) {
      return ` (${filter.length} filters)`
    }
    else {
      return null;
    }
  }
}
