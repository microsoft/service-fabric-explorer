import { Component, OnInit } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { EventChip } from 'src/app/modules/event-store/event-chip/event-chip.component';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent implements OnInit {

  listEventStoreChips: EventChip[];

  constructor(public data: DataService, public settings: SettingsService) { }

  ngOnInit() {
    this.listEventStoreChips = [
      {
        name: '',
        type: 'Node',
        id: '',
        eventsFilter: '' 
      }
    ];
  }

}
