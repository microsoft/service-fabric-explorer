import { Component, OnInit, Input } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-health-badge',
  templateUrl: './health-badge.component.html',
  styleUrls: ['./health-badge.component.scss']
})
export class HealthBadgeComponent implements OnInit {
  public assetBase = environment.assetBase;

  @Input() badgeClass;
  @Input() text: string;

  constructor() { }

  ngOnInit() {
  }

}
