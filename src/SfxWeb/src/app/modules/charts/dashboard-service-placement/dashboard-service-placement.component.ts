import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-dashboard-service-placement',
  templateUrl: './dashboard-service-placement.component.html',
  styleUrls: ['./dashboard-service-placement.component.scss']
})
export class DashboardServicePlacememt {

  @Input() title: string;
  @Input() placementConstraint: string;

  constructor() { }

}
