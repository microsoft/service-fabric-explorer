import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-overview-container',
  templateUrl: './overview-container.component.html',
  styleUrls: ['./overview-container.component.scss']
})
export class OverviewContainerComponent implements OnInit {

  @Input() healthState;

  constructor() { }

  ngOnInit(): void {
  }

}
