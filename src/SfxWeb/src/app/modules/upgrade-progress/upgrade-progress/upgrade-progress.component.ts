import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { UpgradeDomain } from 'src/app/Models/DataModels/Shared';

@Component({
  selector: 'app-upgrade-progress',
  templateUrl: './upgrade-progress.component.html',
  styleUrls: ['./upgrade-progress.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpgradeProgressComponent implements OnInit {

  @Input() upgradeDomains: UpgradeDomain;

  constructor() { }

  ngOnInit() {
  }

}
