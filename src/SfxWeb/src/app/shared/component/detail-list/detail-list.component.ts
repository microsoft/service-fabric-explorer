import { Component, OnInit, Input } from '@angular/core';
import { DataModelCollectionBase } from 'src/app/Models/DataModels/Collections';
import { ListSettings } from 'src/app/Models/ListSettings';

@Component({
  selector: 'detail-list',
  templateUrl: './detail-list.component.html',
  styleUrls: ['./detail-list.component.scss']
})
export class DetailListComponent implements OnInit {

  @Input() listSettings: ListSettings;
  private _list: any[] | DataModelCollectionBase<any>;
  private sortedFilteredList: any[] | DataModelCollectionBase<any>;

  constructor() { }

  ngOnInit() {
  }

  @Input() 
  set list(data:  any[] | DataModelCollectionBase<any>) {
    this._list = data;
    this.sortedFilteredList = data;
  }


}


/*
set up track by function for columnSettings
track by columnSetting.propertyPath

*/