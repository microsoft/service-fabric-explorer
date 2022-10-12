import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-health-badge',
  templateUrl: './health-badge.component.html',
  styleUrls: ['./health-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HealthBadgeComponent{
  public assetBase = environment.assetBase;

  @Input() badgeClass: string;
  @Input() text: string;
  @Input() showText = true;
  @Input() size = '15px';

  constructor() { }
}
