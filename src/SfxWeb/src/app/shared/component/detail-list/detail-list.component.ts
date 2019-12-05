import { Component, OnInit, Input } from '@angular/core';
import { ListSettings } from 'src/app/Models/ListSettings';
import { DataModelCollectionBase } from 'src/app/Models/DataModels/collections/CollectionBase';

@Component({
  selector: 'detail-list',
  templateUrl: './detail-list.component.html',
  styleUrls: ['./detail-list.component.scss']
})
export class DetailListComponent implements OnInit {

  @Input() listSettings: ListSettings;
  private _list: any[] | DataModelCollectionBase<any>;
  private sortedFilteredList: any[] | DataModelCollectionBase<any> = [];

  constructor() { }

  ngOnInit() {
    console.log(this.listSettings)
  }

  @Input() 
  set list(data:  any[] | DataModelCollectionBase<any>) {
    if(data instanceof DataModelCollectionBase){
      console.log(data);
      this._list = data.collection;
    }else{
      this._list = data;
    }

    this.sortedFilteredList = this._list;
  }


}


/*
set up track by function for columnSettings
track by columnSetting.propertyPath

*/