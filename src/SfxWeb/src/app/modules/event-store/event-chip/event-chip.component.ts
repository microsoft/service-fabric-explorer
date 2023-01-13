import { Component, Input, OnInit } from '@angular/core';


export interface IEventChip {
  name: string;
  type: string;
  id: string;
  eventsFilter: string;
}
@Component({
  selector: 'app-event-chip',
  templateUrl: './event-chip.component.html',
  styleUrls: ['./event-chip.component.scss']
})
export class EventChipComponent implements OnInit {

  @Input() data: IEventChip;

  constructor() { }

  ngOnInit(): void {
  }

}
