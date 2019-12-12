import { Component, OnInit } from '@angular/core';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { ListColumnSetting } from 'src/app/Models/ListSettings';
import { FabricEventBase } from 'src/app/Models/eventstore/Events';

@Component({
  selector: 'app-full-description',
  templateUrl: './full-description.component.html',
  styleUrls: ['./full-description.component.scss']
})
export class FullDescriptionComponent implements OnInit, DetailBaseComponent {

  item: FabricEventBase;
  listSetting: ListColumnSetting;

  color =  "white";
  constructor() { }

  ngOnInit() {
    console.log(this.item)
  }

}
