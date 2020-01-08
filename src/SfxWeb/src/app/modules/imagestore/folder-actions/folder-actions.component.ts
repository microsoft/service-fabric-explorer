import { Component, OnInit, OnChanges } from '@angular/core';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { ImageStoreItem, ImageStore } from 'src/app/Models/DataModels/ImageStore';
import { ListColumnSetting } from 'src/app/Models/ListSettings';

@Component({
  selector: 'app-folder-actions',
  templateUrl: './folder-actions.component.html',
  styleUrls: ['./folder-actions.component.scss']
})
export class FolderActionsComponent  implements OnInit, DetailBaseComponent {

  
  item: ImageStoreItem;
  listSetting: ListColumnSettingWithImageStoreActions;

  constructor() { }

  ngOnInit() {
  }

}

export class ListColumnSettingWithImageStoreActions extends ListColumnSetting {
  template = FolderActionsComponent;
  public constructor(public imagestore: ImageStore) {
      super("", "");
  }
}