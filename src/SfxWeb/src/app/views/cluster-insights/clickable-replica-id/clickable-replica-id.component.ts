import { Component, OnInit } from '@angular/core';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { ListColumnSetting } from 'src/app/Models/ListSettings';

@Component({
  selector: 'app-clickable-replica-id',
  templateUrl: './clickable-replica-id.component.html',
  styleUrls: ['./clickable-replica-id.component.scss']
})
export class ClickableReplicaIdComponent implements OnInit, DetailBaseComponent {
  item: any;
  listSetting: any; // Will have the click handler

  constructor() { }

  ngOnInit(): void {
  }

  getReplicaId(): string {
    return this.item?.id || '';
  }

  onClick(): void {
    // Toggle the row expansion and load data
    if (this.listSetting?.clickHandler) {
      this.listSetting.clickHandler(this.item);
    }
  }
}
