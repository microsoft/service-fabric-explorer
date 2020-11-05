import { Component, OnInit } from '@angular/core';
import { ListColumnSetting } from 'src/app/Models/ListSettings';
import { HtmlUtils } from 'src/app/Utils/HtmlUtils';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { Utils } from 'src/app/Utils/Utils';

@Component({
  selector: 'app-row-display',
  templateUrl: './row-display.component.html',
  styleUrls: ['./row-display.component.scss']
})
export class RowDisplayComponent implements OnInit, DetailBaseComponent {

  item: any; // FabricEventInstanceModel
  listSetting: ListColumnSetting;

  color =  'white';
  value = '';
  constructor() { }

  ngOnInit() {
    this.value = Utils.result(this.item, this.listSetting.propertyPath);
    let color = null;
    if (HtmlUtils.eventTypesUtil.isResolved(this.item.raw)) {
        color = '#3AA655';
    } else if (HtmlUtils.eventTypesUtil.isWarning(this.item.raw)) {
        color = '#F2C649';
    } else if (HtmlUtils.eventTypesUtil.isError(this.item.raw)) {
        color = '#FF5349';
    }
    if (color) {
      this.color = color;
    }

  }

}
