import { Component, OnInit } from '@angular/core';
import { EventType } from '../event-store/event-store.component';

@Component({
  selector: 'app-load-events',
  templateUrl: './load-events.component.html',
  styleUrls: ['./load-events.component.scss']
})
export class LoadEventsComponent implements OnInit {

  types: EventType[] = ['Cluster', 'Node', 'Application', 'RepairTask'];
  constructor() { }

  ngOnInit(): void {
  }

}
