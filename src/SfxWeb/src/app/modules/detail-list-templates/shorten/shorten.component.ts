import { ChangeDetectionStrategy, Component, OnChanges, OnInit } from '@angular/core';
import { RepairTask } from 'src/app/Models/DataModels/repairTask';
import { ListColumnSettingWithShorten } from 'src/app/Models/ListSettings';
import { Utils } from 'src/app/Utils/Utils';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';

@Component({
  selector: 'app-shorten',
  templateUrl: './shorten.component.html',
  styleUrls: ['./shorten.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShortenComponent implements DetailBaseComponent, OnInit {

  item: RepairTask;
  listSetting: ListColumnSettingWithShorten;
  value: string | any[];
  cache: any;

  displayValue: string | any[];
  overflow = false;
  constructor() { }

  ngOnInit() {
    this.value = this.listSetting.getValue(this.item);
    this.overflow = this.value.length > this.listSetting.maxWidth;
    this.displayValue = this.value.slice(0, this.listSetting.maxWidth);
    console.log('test');
  }

  flipState() {
    const id = this.item.id;
    if (id in this.cache) {
      this.cache[id] = !this.cache[id];
    }else{
      this.cache[id] = true;
    }
  }
}
