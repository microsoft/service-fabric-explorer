import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { ChipModalComponent } from '../chip-modal/chip-modal.component';
import { IEventStoreData } from '../event-store/event-store.component';

export interface IEventChipData {
  events: IEventStoreData<any, any>;
  chip?: EventChip;
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
      if (result) {
        this.chip = result;
        this.loadEvent.emit(this.chip); 
        if (this.addChip) {
          this.chip = new EventChip();
        }
      }
    });
  }
  
  removeEvents() {
    this.removeEvent.emit(this.chip.name);
  }

}
