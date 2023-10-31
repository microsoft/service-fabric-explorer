import { Component, OnInit } from '@angular/core';
import { ListColumnSettingForArmManaged } from 'src/app/Models/ListSettings';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';

@Component({
  selector: 'app-arm-managed',
  templateUrl: './arm-managed.component.html',
  styleUrls: ['./arm-managed.component.scss']
})
export class ArmManagedComponent implements OnInit, DetailBaseComponent {

  item: any;
  listSetting: ListColumnSettingForArmManaged;

  toolTip: string;
  link: string;

  constructor() { }

  ngOnInit(): void {
    this.toolTip = this.item.resourceId;
    this.link = this.item.resourceId ? `https://ms.portal.azure.com/#@microsoft.onmicrosoft.com/resource${this.item.resourceId}/overview` : null;
  }

}
