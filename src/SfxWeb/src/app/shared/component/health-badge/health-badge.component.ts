import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-health-badge',
  templateUrl: './health-badge.component.html',
  styleUrls: ['./health-badge.component.scss']
})
export class HealthBadgeComponent implements OnInit {

  @Input() badgeClass;
  @Input() text: string;

  constructor() { }

  ngOnInit() {
  }

}
