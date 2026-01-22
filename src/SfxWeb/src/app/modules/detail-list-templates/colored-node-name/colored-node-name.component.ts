import { Component, OnInit } from '@angular/core';
import { ListColumnSetting } from 'src/app/Models/ListSettings';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-colored-node-name',
  templateUrl: './colored-node-name.component.html',
  styleUrls: ['./colored-node-name.component.scss']
})
export class ColoredNodeNameComponent implements OnInit, DetailBaseComponent {
  item: any;
  listSetting: ListColumnSetting;
  value: string;
  assetBase = environment.assetBase;

  constructor() { }

  ngOnInit() {
    this.value = this.listSetting.getValue(this.item);
  }

  getNodeStatus(): string {
    return this.item?.raw?.NodeStatus || '';
  }

  isSeedNode(): boolean {
    return this.item?.raw?.IsSeedNode === true;
  }
}
