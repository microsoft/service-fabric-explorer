import { Component, OnInit } from '@angular/core';
import { ListColumnSetting } from 'src/app/Models/ListSettings';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';

@Component({
  selector: 'app-colored-node-name',
  templateUrl: './colored-node-name.component.html',
  styleUrls: ['./colored-node-name.component.scss']
})
export class ColoredNodeNameComponent implements OnInit, DetailBaseComponent {
  item: any;
  listSetting: ListColumnSetting;
  value: string;

  constructor() { }

  ngOnInit() {
    this.value = this.listSetting.getValue(this.item);
  }

  getNodeStatus(): string {
    return this.item?.raw?.NodeStatus || '';
  }

  getColor(): string {
    const status = this.getNodeStatus();
    return status === 'Up' ? 'var(--badge-ok)' : 'var(--badge-error)';
  }
}
