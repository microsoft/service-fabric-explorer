import { Component, OnInit, OnChanges } from '@angular/core';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { ImageStoreItem, ImageStore } from 'src/app/Models/DataModels/ImageStore';
import { ListColumnSetting } from 'src/app/Models/ListSettings';
import { ActionWithConfirmationDialog } from 'src/app/Models/Action';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-folder-actions',
  templateUrl: './folder-actions.component.html',
  styleUrls: ['./folder-actions.component.scss']
})
export class FolderActionsComponent  implements DetailBaseComponent {


  item: ImageStoreItem;
  listSetting: ListColumnSettingWithImageStoreActions;

  constructor(private data: DataService) { }

  deleteItem() {
    new ActionWithConfirmationDialog(
      this.data.dialog,
      '',
      'Delete Image Store content',
      '',
      () => this.listSetting.imagestore.deleteContent(this.item.path),
      () => true,
      'Confirm Deletion',
      `Delete ${this.item.path}? This action cannot be undone`,
      this.item.path).run();
  }

}

export class ListColumnSettingWithImageStoreActions extends ListColumnSetting {
  template = FolderActionsComponent;
  public constructor(public imagestore: ImageStore) {
      super('', '', {
        canNotExport: true
      });
  }
}
