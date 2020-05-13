import { Component, OnInit, Input } from '@angular/core';
import { UpgradeDomain } from 'src/app/Models/DataModels/Shared';

@Component({
  selector: 'upgrade-progress',
  templateUrl: './upgrade-progress.component.html',
  styleUrls: ['./upgrade-progress.component.scss']
})
export class UpgradeProgressComponent implements OnInit {

  @Input() upgradeDomains: UpgradeDomain;

  constructor() { }

  ngOnInit() {
  }

}
