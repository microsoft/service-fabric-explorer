import { Component, OnInit } from '@angular/core';
import { ApplicationUpgradeProgress } from 'src/app/Models/DataModels/Application';
import { ListColumnSetting } from 'src/app/Models/ListSettings';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';

@Component({
  selector: 'app-view-upgrades-list-item',
  templateUrl: './view-upgrades-list-item.component.html',
  styleUrls: ['./view-upgrades-list-item.component.scss']
})
export class ViewUpgradesListItemComponent implements DetailBaseComponent {
  listSetting: ListColumnSetting;
  item: ApplicationUpgradeProgress;

  constructor() { }

}
