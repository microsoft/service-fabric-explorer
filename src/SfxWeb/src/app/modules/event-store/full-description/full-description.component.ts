import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { ListColumnSetting } from 'src/app/Models/ListSettings';
import { FabricEventBase } from 'src/app/Models/eventstore/Events';

@Component({
  selector: 'app-full-description',
  templateUrl: './full-description.component.html',
  styleUrls: ['./full-description.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FullDescriptionComponent implements DetailBaseComponent, OnInit {

  copyText = '';
  item: FabricEventBase;
  listSetting: ListColumnSetting;

  color =  'white';
  constructor() { }

  ngOnInit() {
    this.copyText = JSON.stringify(this.item.raw.raw, null, '\t');
  }
}
