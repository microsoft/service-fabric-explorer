import { Component, OnInit, Input} from '@angular/core';
import { ListSettings, ListColumnSetting } from 'src/app/Models/ListSettings';
import { DataModelCollectionBase } from 'src/app/Models/DataModels/collections/CollectionBase';

@Component({
  selector: 'detail-list',
  templateUrl: './detail-list.component.html',
  styleUrls: ['./detail-list.component.scss']
})
export class DetailListComponent implements OnInit {

  @Input() listSettings: ListSettings;
  private _list: any[] | DataModelCollectionBase<any>;
  private sortedFilteredList: any[] =[]; 

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

    this.sortedFilteredList = this._list || [];
  }


  get partialList() {
    if(this.sortedFilteredList){
      return this.sortedFilteredList.slice(0 , 10);
    }

    return [];
  }


  public handleClickRow(item: any, event: any): void {
      if (event && event.target !== event.currentTarget) { return; }
      if (this.listSettings.secondRowCollapsible && this.listSettings.showSecondRow(item)) {
          item.isSecondRowCollapsed = !item.isSecondRowCollapsed;
      }
  }

  trackByColumnSetting(columnSetting: ListColumnSetting) {
    return columnSetting.propertyPath
  }

}


/*
set up track by function for columnSettings
track by columnSetting.propertyPath

*/