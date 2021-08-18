import { Component, OnInit } from '@angular/core';
import { ListColumnSetting } from 'src/app/Models/ListSettings';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';

@Component({
  selector: 'app-copy-text',
  templateUrl: './copy-text.component.html',
  styleUrls: ['./copy-text.component.scss']
})
export class CopyTextComponent implements DetailBaseComponent, OnInit {

  item: any;
  listSetting: ListColumnSetting;

  value: string;
  constructor() { }

  ngOnInit() {
    this.value = this.listSetting.getValue(this.item);
  }

}
