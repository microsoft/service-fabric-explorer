import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-event-chip',
  templateUrl: './event-chip.component.html',
  styleUrls: ['./event-chip.component.scss']
})
export class EventChipComponent implements OnInit {

  name: string;
  type: string;
  id: string;
  eventsFilter: string;

  constructor() { }

  ngOnInit(): void {
  }

}
